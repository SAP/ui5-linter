import ts from "typescript";
import path from "node:path/posix";
import {ChangeAction, ImportRequests, ChangeSet, ExistingModuleDeclarationInfo} from "../autofix.js";
import {collectModuleIdentifiers} from "../utils.js";
import {resolveUniqueName} from "../../linter/ui5Types/utils/utils.js";
const LINE_LENGTH_LIMIT = 200;

function resolveRelativeDependency(dependency: string, moduleName: string): string {
	return path.resolve("/" + path.dirname(moduleName), dependency).substring(1);
}

function createDependencyInfo(dependencies: ts.NodeArray<ts.Expression> | undefined, resourcePath: string) {
	const moduleName =
		resourcePath.startsWith("/resources/") ? resourcePath.substring("/resources/".length) : undefined;
	const dependencyMap = new Map<string, {node: ts.StringLiteralLike; index: number}>();
	const quoteStyleCount = {
		"`": 0,
		"'": 0,
		"\"": 0, // Double quotes will be prioritized if tied
	};
	dependencies?.forEach((dependency, index) => {
		if (!ts.isStringLiteralLike(dependency)) {
			return;
		}
		// In case of duplicate imports, we only use the first one.
		// As the map is only used for a lookup for reusing existing imports and not
		// as a exhaustive list of dependencies, this is fine.
		let dependencyText = dependency.text;
		if (moduleName && dependencyText.startsWith(".")) {
			dependencyText = resolveRelativeDependency(dependencyText, moduleName);
		}

		if (!dependencyMap.has(dependencyText)) {
			dependencyMap.set(dependencyText, {node: dependency, index});
		}

		// Check which quote style format is used for existing dependencies
		// and use the same for the new dependencies (majority wins):
		if (dependency.getText().startsWith("'")) {
			quoteStyleCount["'"]++;
		} else if (dependency.getText().startsWith("\"")) {
			quoteStyleCount["\""]++;
		} else if (ts.isNoSubstitutionTemplateLiteral(dependency)) {
			quoteStyleCount["`"]++;
		}
	});
	const mostUsedQuoteStyle = Object.entries(quoteStyleCount).reduce((a, b) => a[1] > b[1] ? a : b)[0];
	return {dependencyMap, mostUsedQuoteStyle};
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
	changeSet: ChangeSet[],
	resourcePath: string
) {
	const {moduleDeclaration, importRequests} = moduleDeclarationInfo;

	if (importRequests.size === 0) {
		return;
	}

	const factory = "factory" in moduleDeclaration ? moduleDeclaration.factory : moduleDeclaration.callback;

	if (!factory || !ts.isFunctionLike(factory)) {
		throw new Error("Invalid factory function");
	}

	const moduleName = "moduleName" in moduleDeclaration ? moduleDeclaration.moduleName : undefined;

	const declaredIdentifiers = collectModuleIdentifiers(factory);

	const dependencies = moduleDeclaration.dependencies?.elements;
	const {dependencyMap, mostUsedQuoteStyle} = createDependencyInfo(dependencies, resourcePath);

	const parameters = factory.parameters;
	const parameterSyntax = getParameterSyntax(factory);

	const newDependencies: {moduleName: string; identifier: string}[] = [];

	// Prefer using the second element for separator detection as the first one might not have a line-break before it
	const depsSeparator = extractIdentifierSeparator(
		dependencies?.[1]?.getFullText() ?? dependencies?.[0]?.getFullText() ?? "");
	const identifiersSeparator = extractIdentifierSeparator(
		factory.parameters[1]?.getFullText() ??
		factory.parameters[0]?.getFullText() ?? "");

	// Calculate after which index we can add new dependencies
	const insertAfterIndex = Math.min(parameters.length, dependencies?.length ?? 0) - 1;

	// Check whether requested imports are already available in the list of dependencies
	for (const [requestedModuleName, importRequest] of importRequests) {
		let dependencyModuleName = requestedModuleName;
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

				// Ensure that the new dependency will be the same, e.g. in case it is a relative path
				dependencyModuleName = existingDependency.node.text;
			}
		}
		// Add a completely new module dependency
		const identifier = resolveUniqueName(dependencyModuleName, declaredIdentifiers);
		declaredIdentifiers.add(identifier);
		importRequest.identifier = identifier;
		newDependencies.push({
			moduleName: dependencyModuleName,
			identifier,
		});
	}

	// Add new dependencies
	if (newDependencies.length) {
		const newDependencyValue = newDependencies.map((newDependency) => {
			return `${mostUsedQuoteStyle}${newDependency.moduleName}${mostUsedQuoteStyle}`;
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
		} else {
			// No dependencies array found, add a new one right before the factory function
			const start = (moduleName ? defineCall.arguments[1] : defineCall.arguments[0]).getStart();
			changeSet.push({
				action: ChangeAction.INSERT,
				start,
				value: `[${formatDependencies(newDependencyValue, depsSeparator,
					{pos: start, node: defineCall})}], `,
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
			const node: ts.Node = nodeInfo.node;
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
