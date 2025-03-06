import ts from "typescript";
import {ChangeAction, ImportRequests, ChangeSet, ExistingModuleDeclarationInfo} from "../autofix.js";
import {collectModuleIdentifiers} from "../utils.js";
import {resolveUniqueName} from "../../linter/ui5Types/utils/utils.js";

export function addDependencies(
	defineCall: ts.CallExpression, moduleDeclarationInfo: ExistingModuleDeclarationInfo,
	changeSet: ChangeSet[]
) {
	const {moduleDeclaration, importRequests} = moduleDeclarationInfo;

	if (importRequests.size === 0) {
		return;
	}

	const declaredIdentifiers = collectModuleIdentifiers(moduleDeclaration.factory);

	const defineCallArgs = defineCall.arguments;
	const existingImportModules = defineCall.arguments && ts.isArrayLiteralExpression(defineCallArgs[0]) ?
			defineCallArgs[0].elements.map((el) => ts.isStringLiteralLike(el) ? el.text : "") :
			[];

	if (!ts.isFunctionLike(moduleDeclaration.factory)) {
		throw new Error("Invalid factory function");
	}
	const existingIdentifiers = moduleDeclaration.factory
		.parameters.map((param: ts.ParameterDeclaration) => (param.name as ts.Identifier).text);
	const existingIdentifiersLength = existingIdentifiers.length;

	const imports = [...importRequests.keys()];

	const identifiersForExistingImports: string[] = [];
	let existingIdentifiersCut = 0;
	existingImportModules.forEach((existingModule, index) => {
		const indexOf = imports.indexOf(existingModule);
		const identifierName = existingIdentifiers[index] ||
			resolveUniqueName(existingModule, declaredIdentifiers);
		declaredIdentifiers.add(identifierName);
		identifiersForExistingImports.push(identifierName);
		if (indexOf !== -1) {
			// If there are defined dependencies, but identifiers for them are missing,
			// and those identifiers are needed in the code, then we need to find out
			// up to which index we need to build identifiers and cut the rest.
			existingIdentifiersCut = index > existingIdentifiersCut ? (index + 1) : existingIdentifiersCut;
			imports.splice(indexOf, 1);
			importRequests.get(existingModule)!.identifier = identifierName;
		}
	});

	// Cut identifiers that are already there
	identifiersForExistingImports.splice(existingIdentifiersCut);

	const dependencies = imports.map((i) => `"${i}"`);
	const identifiers = [
		...identifiersForExistingImports,
		...imports.map((i) => {
			const identifier = resolveUniqueName(i, declaredIdentifiers);
			declaredIdentifiers.add(identifier);
			importRequests.get(i)!.identifier = identifier;
			return identifier;
		})];

	if (dependencies.length) {
		// Add dependencies
		if (moduleDeclaration.dependencies) {
			const depsNode = defineCall.arguments[0];
			const depElementNodes = depsNode && ts.isArrayLiteralExpression(depsNode) ? depsNode.elements : [];
			const insertAfterElement = depElementNodes[existingIdentifiersLength - 1] ??
				depElementNodes[depElementNodes.length - 1];

			if (insertAfterElement) {
				changeSet.push({
					action: ChangeAction.INSERT,
					start: insertAfterElement.getEnd(),
					value: (existingImportModules.length ? ", " : "") + dependencies.join(", "),
				});
			} else {
				changeSet.push({
					action: ChangeAction.REPLACE,
					start: depsNode.getFullStart(),
					end: depsNode.getEnd(),
					value: `[${dependencies.join(", ")}]`,
				});
			}
		} else {
			changeSet.push({
				action: ChangeAction.INSERT,
				start: defineCall.arguments[0].getFullStart(),
				value: `[${dependencies.join(", ")}], `,
			});
		}
	}

	if (identifiers.length) {
		const closeParenToken = moduleDeclaration.factory.getChildren()
			.find((c) => c.kind === ts.SyntaxKind.CloseParenToken);
		// Factory arguments
		const syntaxList = moduleDeclaration.factory.getChildren()
			.find((c) => c.kind === ts.SyntaxKind.SyntaxList);
		if (!syntaxList) {
			throw new Error("Invalid factory syntax");
		}

		// Patch factory arguments
		const value = (existingIdentifiersLength ? ", " : "") + identifiers.join(", ");
		if (!closeParenToken) {
			changeSet.push({
				action: ChangeAction.INSERT,
				start: syntaxList.getStart(),
				value: "(",
			});
			changeSet.push({
				action: ChangeAction.INSERT,
				start: syntaxList.getEnd(),
				value: `${value})`,
			});
		} else {
			let start = syntaxList.getEnd();

			// Existing trailing comma: Insert new args before it, to keep the trailing comma
			const lastSyntaxListChild = syntaxList.getChildAt(syntaxList.getChildCount() - 1);
			if (lastSyntaxListChild?.kind === ts.SyntaxKind.CommaToken) {
				start = lastSyntaxListChild.getStart();
			}

			changeSet.push({
				action: ChangeAction.INSERT,
				start,
				value,
			});
		}
	}

	// Patch identifiers
	patchIdentifiers(importRequests, changeSet);
}

function patchIdentifiers(importRequests: ImportRequests, changeSet: ChangeSet[]) {
	for (const {nodeInfos, identifier} of importRequests.values()) {
		if (!identifier) {
			throw new Error("No identifier found for import");
		}

		for (const nodeInfo of nodeInfos) {
			if (!nodeInfo.node) {
				continue;
			}
			let node: ts.Node = nodeInfo.node;

			if ("namespace" in nodeInfo && nodeInfo.namespace === "sap.ui.getCore") {
				node = node.parent;
			}
			const nodeStart = node.getStart();
			const nodeEnd = node.getEnd();
			const nodeReplacement = `${identifier}`;

			changeSet.push({
				action: ChangeAction.REPLACE,
				start: nodeStart,
				end: nodeEnd,
				value: nodeReplacement,
			});
		}
	}
}
