import ts from "typescript";
import path from "node:path/posix";
import {ChangeAction, ImportRequests, ChangeSet, ExistingModuleDeclarationInfo} from "../autofix.js";
import {collectModuleIdentifiers} from "../utils.js";
import {resolveUniqueName} from "../../linter/ui5Types/utils/utils.js";
const LINE_LENGTH_LIMIT = 200;

function resolveRelativeDependency(dependency: string, moduleName: string): string {
	return path.resolve("/" + path.dirname(moduleName), dependency).substring(1);
}

interface DependencyMapValue {
	node: ts.StringLiteralLike;
	index: number;
	leadingComma?: ts.Token<ts.SyntaxKind.CommaToken>;
	trailingComma?: ts.Token<ts.SyntaxKind.CommaToken>;
}

function createDependencyInfo(dependencyArray: ts.ArrayLiteralExpression | undefined, resourcePath: string) {
	const moduleName =
		resourcePath.startsWith("/resources/") ? resourcePath.substring("/resources/".length) : undefined;
	const dependencyMap = new Map<string, DependencyMapValue>();
	const quoteStyleCount = {
		"`": 0,
		"'": 0,
		"\"": 0, // Double quotes will be prioritized if tied
	};
	if (dependencyArray) {
		let syntaxList: ts.SyntaxList | undefined;
		for (const child of dependencyArray.getChildren()) {
			if (child.kind === ts.SyntaxKind.SyntaxList) {
				syntaxList = child as ts.SyntaxList;
			}
		}
		if (!syntaxList) {
			throw new Error("SyntaxList not found in dependencies array");
		}

		let previousComma: ts.Token<ts.SyntaxKind.CommaToken> | undefined;
		let previousDependency: DependencyMapValue | undefined;
		for (const child of syntaxList.getChildren()) {
			if (child.kind === ts.SyntaxKind.CommaToken) {
				if (previousDependency) {
					previousDependency.trailingComma = child as ts.Token<ts.SyntaxKind.CommaToken>;
					previousDependency = undefined;
				}
				previousComma = child as ts.Token<ts.SyntaxKind.CommaToken>;
			}

			if (!ts.isStringLiteralLike(child)) {
				continue;
			}
			// In case of duplicate imports, we only use the first one.
			// As the map is only used for a lookup for reusing existing imports and not
			// as a exhaustive list of dependencies, this is fine.
			let dependencyText = child.text;
			if (moduleName && dependencyText.startsWith(".")) {
				dependencyText = resolveRelativeDependency(dependencyText, moduleName);
			}

			if (!dependencyMap.has(dependencyText)) {
				previousDependency = {node: child, index: dependencyArray.elements.indexOf(child)};
				if (previousComma) {
					previousDependency.leadingComma = previousComma;
					previousComma = undefined;
				}
				dependencyMap.set(dependencyText, previousDependency);
			}

			// Check which quote style format is used for existing dependencies
			// and use the same for the new dependencies (majority wins):
			if (child.getText().startsWith("'")) {
				quoteStyleCount["'"]++;
			} else if (child.getText().startsWith("\"")) {
				quoteStyleCount["\""]++;
			} else if (ts.isNoSubstitutionTemplateLiteral(child)) {
				quoteStyleCount["`"]++;
			}
		}
	}
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
	const {dependencyMap, mostUsedQuoteStyle} = createDependencyInfo(moduleDeclaration.dependencies, resourcePath);
	let numberOfDependencies = dependencies?.length ?? 0;

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
				let start = existingDependency.node.getFullStart();
				let end = existingDependency.node.getEnd();

				// Leading comma means, it's not the first dependency, so we also remove the comma before the dependency
				if (existingDependency.leadingComma) {
					start = existingDependency.leadingComma.getFullStart();
				} else if (existingDependency.trailingComma) {
					// First dependency, but there might be more, so we also remove the comma after the dependency
					end = existingDependency.trailingComma.getEnd();
				}
				changeSet.push({action: ChangeAction.DELETE, start, end});
				dependencyMap.delete(requestedModuleName);

				// Update number of dependencies
				numberOfDependencies--;

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
		}).join(depsSeparator.trailing);

		const insertAfterDependencyElement = dependencies?.[insertAfterIndex];
		if (insertAfterDependencyElement || (dependencies && insertAfterIndex === -1)) {
			const existingDependenciesLeft = insertAfterIndex > -1 && numberOfDependencies > 0;
			const existingDependenciesRight = insertAfterIndex === -1 && numberOfDependencies > 0;
			let value = existingDependenciesLeft ? depsSeparator.trailing : depsSeparator.leading;
			value += newDependencyValue;
			if (existingDependenciesRight) {
				if (depsSeparator.trailing.includes("\n")) {
					value += ",";
				} else {
					// Ensure to add a new space in case there are no line-breaks for separation
					value += ", ";
				}
			}
			const start = insertAfterDependencyElement?.getEnd() ?? dependencies.pos;
			changeSet.push({
				action: ChangeAction.INSERT,
				start,
				value: formatDependencies(value, depsSeparator.trailing, {pos: start, node: defineCall}),
			});
		} else {
			// No dependencies array found, add a new one right before the factory function
			const start = (moduleName ? defineCall.arguments[1] : defineCall.arguments[0]).getStart();
			changeSet.push({
				action: ChangeAction.INSERT,
				start,
				value: `[${formatDependencies(newDependencyValue, depsSeparator.trailing,
					{pos: start, node: defineCall})}], `,
			});
		}

		let newParametersValue = newDependencies.map((newDependency) => {
			return newDependency.identifier;
		}).join(identifiersSeparator.trailing);

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

		let value = existingParameterLeft ? (identifiersSeparator.trailing + newParametersValue) : newParametersValue;
		value += existingParameterRight ? ", " : "";

		const start = insertAfterParameterDeclaration?.getEnd() ?? parameterSyntax.syntaxList.getStart();
		changeSet.push({
			action: ChangeAction.INSERT,
			start,
			value: formatDependencies(value, identifiersSeparator.trailing, {pos: start, node: defineCall}),
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
	let leading = "";
	if (match?.[0].includes("\n")) {
		// Only use the leading whitespace if it contains a line-break
		// Otherwise a single space might be used because the extraction is
		// done on the 2nd element in the array, if it exists
		leading = match[0];
	}
	return {
		leading,
		trailing: match ? `,${match[0]}` : ", ",
	};
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
