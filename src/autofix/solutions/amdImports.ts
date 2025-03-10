import ts from "typescript";
import {ChangeAction, ImportRequests, ChangeSet, ExistingModuleDeclarationInfo} from "../autofix.js";
import {collectModuleIdentifiers} from "../utils.js";
import {resolveUniqueName} from "../../linter/ui5Types/utils/utils.js";
const LINE_LENGTH_LIMIT = 200;

function createDependencyMap(dependencies: ts.NodeArray<ts.Expression> | undefined) {
	const dependencyMap = new Map<string, {node: ts.StringLiteralLike; index: number}>();
	dependencies?.forEach((dependency, index) => {
		if (!ts.isStringLiteralLike(dependency)) {
			return;
		}
		// In case of duplicate imports, we only use the first one.
		// As the map is only used for a lookup for reusing existing imports and not
		// as a exhaustive list of dependencies, this is fine.
		if (!dependencyMap.has(dependency.text)) {
			dependencyMap.set(dependency.text, {node: dependency, index});
		}
	});
	return dependencyMap;
}

function getParameterDeclarationText(param: ts.ParameterDeclaration): string | undefined {
	if (!ts.isIdentifier(param.name)) {
		return;
	}
	return param.name.text;
}

function getParameterSyntax(
	node: ts.ArrowFunction | ts.FunctionDeclaration | ts.FunctionExpression
): {syntaxList: ts.SyntaxList; hasParens: boolean} {
	let syntaxList: ts.SyntaxList | undefined;
	let hasParens = false;
	for (const child of node.getChildren()) {
		if (child.kind === ts.SyntaxKind.SyntaxList) {
			syntaxList = child as ts.SyntaxList;
		}
		if (child.kind === ts.SyntaxKind.OpenParenToken || child.kind === ts.SyntaxKind.CloseParenToken) {
			hasParens = true;
		}
	}
	if (syntaxList) {
		return {syntaxList, hasParens};
	} else {
		throw new Error("SyntaxList not found in factory function");
	}
}

export function addDependencies(
	defineCall: ts.CallExpression, moduleDeclarationInfo: ExistingModuleDeclarationInfo,
	changeSet: ChangeSet[]
) {
	const {moduleDeclaration, importRequests} = moduleDeclarationInfo;

	if (importRequests.size === 0) {
		return;
	}

	if (!ts.isFunctionLike(moduleDeclaration.factory)) {
		throw new Error("Invalid factory function");
	}

	const declaredIdentifiers = collectModuleIdentifiers(moduleDeclaration.factory);

	const dependencies = moduleDeclaration.dependencies?.elements;
	const dependencyMap = createDependencyMap(dependencies);

	const parameters = moduleDeclaration.factory.parameters;
	const parameterSyntax = getParameterSyntax(moduleDeclaration.factory);

	const newDependencies: {moduleName: string; identifier: string}[] = [];

	const depsSeparator = extractIdentifierSeparator(dependencies?.[0]?.getFullText() ?? "");
	const identifiersSeparator = extractIdentifierSeparator(
		moduleDeclaration.factory.parameters[0]?.getFullText() ?? "");

	// Calculate after which index we can add new dependencies
	const insertAfterIndex = Math.min(parameters.length, dependencies?.length ?? 0) - 1;

	// Check whether requested imports are already available in the list of dependencies
	for (const [requestedModuleName, importRequest] of importRequests) {
		const existingDependency = dependencyMap.get(requestedModuleName);
		if (existingDependency) {
			// Reuse the existing dependency
			// Check whether a parameter name already exists for this dependency
			// Lookup needs to be based on the same index of the parameter in the factory function
			const existingParameter = parameters[existingDependency.index];
			if (existingParameter) {
				// Existing parameter can be reused
				importRequest.identifier = getParameterDeclarationText(existingParameter);
				continue;
			} else {
				// Dependency exist, but without a function parameter.
				// Remove the dependency so that it will be handled together with the new dependencies
				changeSet.push({
					action: ChangeAction.DELETE,
					// Also remove the comma before the dependency
					start: existingDependency.node.getFullStart() - (existingDependency.index > 0 ? 1 : 0),
					end: existingDependency.node.getEnd(),
				});
				dependencyMap.delete(requestedModuleName);
			}
		}
		// Add a completely new module dependency
		const identifier = resolveUniqueName(requestedModuleName, declaredIdentifiers);
		declaredIdentifiers.add(identifier);
		importRequest.identifier = identifier;
		newDependencies.push({
			moduleName: requestedModuleName,
			identifier,
		});
	}

	// Add new dependencies
	if (newDependencies.length) {
		const newDependencyValue = newDependencies.map((newDependency) => {
			return `"${newDependency.moduleName}"`;
		}).join(depsSeparator);

		const insertAfterDependencyElement = dependencies?.[insertAfterIndex];
		if (insertAfterDependencyElement || (dependencies && insertAfterIndex === -1)) {
			const existingDependenciesLeft = insertAfterIndex > -1 && dependencyMap.size > 0;
			const existingDependenciesRight = insertAfterIndex === -1 && dependencyMap.size > 0;
			let value = existingDependenciesLeft ? (depsSeparator + newDependencyValue) : newDependencyValue;
			value += existingDependenciesRight ? ", " : "";
			const start = insertAfterDependencyElement?.getEnd() ?? dependencies.pos;
			changeSet.push({
				action: ChangeAction.INSERT,
				start,
				value: formatDependencies(value, depsSeparator, {pos: start, node: defineCall}),
			});
		} else if (moduleDeclaration.dependencies) {
			const start = moduleDeclaration.dependencies.getStart();
			const end = moduleDeclaration.dependencies.getEnd();
			changeSet.push({
				action: ChangeAction.REPLACE,
				start,
				end,
				value: `[${formatDependencies(newDependencyValue, depsSeparator, {pos: start, node: defineCall})}]`,
			});
		} else {
			changeSet.push({
				action: ChangeAction.INSERT,
				// TODO: is this correct if the module name is defined as first argument?
				start: defineCall.arguments[0].getFullStart(),
				value: `[${formatDependencies(newDependencyValue, depsSeparator,
					{pos: defineCall.arguments[0].getFullStart(), node: defineCall})}], `,
			});
		}

		let newParametersValue = newDependencies.map((newDependency) => {
			return newDependency.identifier;
		}).join(identifiersSeparator);

		if (!parameterSyntax.hasParens) {
			changeSet.push({
				action: ChangeAction.INSERT,
				start: parameterSyntax.syntaxList.getStart(),
				value: "(",
			});
			newParametersValue += ")";
		}

		const insertAfterParameterDeclaration = parameters[insertAfterIndex];

		const existingParameterLeft = insertAfterIndex > -1 && parameters.length > 0;
		const existingParameterRight = insertAfterIndex === -1 && parameters.length > 0;

		let value = existingParameterLeft ? (identifiersSeparator + newParametersValue) : newParametersValue;
		value += existingParameterRight ? ", " : "";

		const start = insertAfterParameterDeclaration?.getEnd() ?? parameterSyntax.syntaxList.getStart();
		changeSet.push({
			action: ChangeAction.INSERT,
			start,
			value: formatDependencies(value, identifiersSeparator, {pos: start, node: defineCall}),
		});
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

function extractIdentifierSeparator(input: string) {
	const match = /^(\s)+/.exec(input);
	return match ? `,${match[0]}` : ", ";
}

function formatDependencies(input: string, depsSeparator: string, posInfo: {pos: number; node: ts.Node}) {
	const {node, pos} = posInfo;
	const {character} = node.getSourceFile().getLineAndCharacterOfPosition(pos);

	let offset = character + 1;

	// If the input is multiline, we don't need to format it
	if (depsSeparator.includes("\n") || (input.length + offset) <= LINE_LENGTH_LIMIT) {
		return input;
	}

	const inputChunks = input.split(",");
	let finalString = "";
	let curLineLength = 0;
	inputChunks.forEach((chunk) => {
		if ((curLineLength + chunk.length + offset) > LINE_LENGTH_LIMIT) {
			curLineLength = 0;
			finalString += `\n`;
			// The offset is important only for the first line
			offset = 0;
		}

		finalString += `${chunk},`;
		curLineLength += chunk.length;
	});

	return finalString.substring(0, finalString.length - 1); // Cut the last comma
}
