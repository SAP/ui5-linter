import ts from "typescript";
import {type PositionInfo, type RawLintMessage} from "../../linter/LinterContext.js";
import {
	ChangeAction,
	type ChangeSet,
	type ReplaceChange,
	type ExistingModuleDeclarationInfo,
	type ImportRequests,
} from "../autofix.js";
import {type FixHints} from "../../linter/ui5Types/fixHints/FixHints.js";
import {resolveUniqueName} from "../../linter/ui5Types/utils/utils.js";
import {getLogger} from "@ui5/logger";

const log = getLogger("linter:autofix:codeReplacer");

/**
 * Replaces the existing code with a specific snippet.
 * Important placeholders:
 * - $moduleIdentifier: The identifier of the module (moduleName), if available
 * - $identifier_1, $identifier_2, ...: Unique identifiers for the arguments
 * - $1, $2, ...: The arguments of the function
 *
 * @example
 * ["removeUrlWhitelist", {
		moduleName: "sap/base/security/URLListValidator",
		exportCodeToBeUsed: `var $identifier_1 = $moduleIdentifier.entries();
 * $identifier_1.splice($1, 1);
 * $moduleIdentifier.clear();
 * $identifier_1.forEach(({protocol, host, port, path}) => $moduleIdentifier.add(protocol, host, port, path))`,
	}]
 */
export default function generateSolutionCodeReplacer(
	moduleDeclarations: Map<ts.CallExpression, ExistingModuleDeclarationInfo>, messages: RawLintMessage[],
	changeSet: ChangeSet[], sourceFile: ts.SourceFile, declaredIdentifiers: Set<string>) {
	for (const {fixHints, position, args} of messages) {
		const apiName = "apiName" in args ? args.apiName : undefined;
		const functionName = "functionName" in args ? args.functionName : undefined;
		const patchedFixHints = patchMessageFixHints(fixHints, apiName ?? functionName);

		if (!patchedFixHints || !("exportCodeToBeUsed" in patchedFixHints) ||
			!patchedFixHints.exportCodeToBeUsed || !(typeof patchedFixHints.exportCodeToBeUsed === "object") ||
			!position ||
			!moduleDeclarations.size) {
			continue;
		}

		// Find the imports from module declarations in the context/scope of the message
		const importRequests = getContextImportRequests(sourceFile, moduleDeclarations, position);

		const {exportCodeToBeUsed, moduleName} = patchedFixHints;
		const moduleInfo = moduleName ? importRequests.get(moduleName) : null;
		if (moduleInfo?.identifier) {
			exportCodeToBeUsed.name =
				exportCodeToBeUsed.name.replaceAll("$moduleIdentifier", moduleInfo.identifier);
		}
		let identifierIndex = 1;
		while (exportCodeToBeUsed.name.includes("$identifier")) {
			const identifier = resolveUniqueName(apiName ?? moduleName ?? "j", declaredIdentifiers);
			declaredIdentifiers.add(identifier);
			exportCodeToBeUsed.name =
				exportCodeToBeUsed.name.replaceAll(`$identifier_${identifierIndex}`, identifier);
			identifierIndex++;
		}

		let value = exportCodeToBeUsed.args?.reduce((acc, arg, index) => {
			return acc?.replace(new RegExp(`\\$${index + 1}(?!\\d)`, "g"), patchArguments(arg, apiName));
		}, exportCodeToBeUsed.name ?? "") ?? exportCodeToBeUsed.name;
		value = value.replaceAll(/\$\d+/g, "undefined"); // Some placeholders might be "empty" in the original code

		// Calculate the replacement position
		// It cannot be derived from the fixHintsGenerator as it works on the compiled source file.
		// Just take the length of the old and the original start position
		let pos;
		if (moduleInfo?.nodeInfos) {
			// For jQuery function deprecations, the node might only cover
			// the deprecated method, but not the whole expression.
			// Find the expression and update the position.
			const nodeInfoAtPosition = moduleInfo.nodeInfos.find((nodeInfo) => {
				return nodeInfo.position.line === (position.line - 1) &&
					nodeInfo.position.column === (position.column - 1);
			});

			if (nodeInfoAtPosition?.node && !ts.isCallExpression(nodeInfoAtPosition.node) &&
				ts.isPropertyAccessExpression(nodeInfoAtPosition.node) &&
				nodeInfoAtPosition.node.expression && ts.isCallExpression(nodeInfoAtPosition.node.expression)) {
				pos = sourceFile.getLineAndCharacterOfPosition(nodeInfoAtPosition.node.expression.pos);
			}
		}
		const line = pos ? pos.line : (position.line - 1);
		const column = pos ? (pos.character + 1) : (position.column - 1);
		const start = sourceFile.getPositionOfLineAndCharacter(line, column);
		const end = start + exportCodeToBeUsed.solutionLength;

		cleanupChangeSet(changeSet, start, end);

		changeSet.push({
			action: ChangeAction.REPLACE,
			start,
			end,
			value,
		});
	}
}

const importRequestsCache = new Map<number, ImportRequests>();
// Finds the imports from module declarations in the context/scope of the message
function getContextImportRequests(
	sourceFile: ts.SourceFile,
	moduleDeclarations: Map<ts.CallExpression, ExistingModuleDeclarationInfo>,
	messagePosInfo: PositionInfo) {
	const importRequests: ImportRequests = new Map();
	const position = sourceFile.getPositionOfLineAndCharacter(messagePosInfo.line - 1, messagePosInfo.column - 1);

	if (importRequestsCache.has(position)) {
		return importRequestsCache.get(position)!;
	}

	for (const [callExpression, moduleDeclarationInfo] of moduleDeclarations.entries()) {
		if (callExpression.getStart() < position && position < callExpression.getEnd()) {
			moduleDeclarationInfo.importRequests.forEach((value, key) => {
				importRequests.set(key, value);
			});
		}
	}

	importRequestsCache.set(position, importRequests);
	return importRequests;
}

// Avoid replacements on colliding position.
// TODO: For future we need to find a way to merge the changes
// Currently it skips replacements of an imported jQuery module variable as it is unnecessary.
function cleanupChangeSet(changeSet: ChangeSet[], start: number, end: number) {
	function isReplacementChangeSet(changeSet: ChangeSet): changeSet is ReplaceChange {
		return changeSet.action === ChangeAction.REPLACE;
	}

	let i = 0;
	while (changeSet[i]) {
		const isReplacement = isReplacementChangeSet(changeSet[i]);
		if (!isReplacement) {
			i++;
			continue;
		}
		const replacementSet = changeSet[i] as ReplaceChange;

		if (start <= replacementSet.start && replacementSet.end <= end) {
			changeSet.splice(i, 1);
		} else {
			i++;
		}
	}
}

function patchArguments(arg: string, apiName?: string) {
	if (!["jQuery.sap.registerResourcePath", "jQuery.sap.registerModulePath"].includes(apiName ?? "")) {
		return arg;
	}

	// jQuery.sap.registerResourcePath has a special case where the
	// argument can be a string or an object
	if (arg.startsWith("{") && arg.endsWith("}")) {
		const matcher = /(?:['"]?\b(?:path|url)\b['"]?\s*:\s*)(['"][^'"]+['"])/;
		const match = matcher.exec(arg);
		return match?.[1] ?? arg;
	} else {
		return arg;
	}
}

function patchMessageFixHints(fixHints?: FixHints, apiName?: string) {
	if (!fixHints || !("exportCodeToBeUsed" in fixHints) ||
		!fixHints.exportCodeToBeUsed ||
		!(typeof fixHints.exportCodeToBeUsed === "object")) {
		return fixHints;
	}

	if (apiName === "jQuery.sap.getUriParameters" && fixHints.exportCodeToBeUsed.args?.[0]) {
		let dummyUrl = "";
		try {
			new URL(fixHints.exportCodeToBeUsed.args[0]);
		} catch (_e) {
			// Adding a domain to the URL to prevent errors and parse correctly the query string
			dummyUrl = ", \"http://dummy.local\"";
		}
		fixHints.exportCodeToBeUsed.name = `new URL($1${dummyUrl}).searchParams`;
	} else if (apiName?.startsWith("jQuery.sap.charToUpperCase")) {
		// If no position is given or when it is negative or beyond the last character
		// of the given string, the first character will be converted to upper case.
		const charToUpperCase = parseInt(fixHints.exportCodeToBeUsed?.args?.[1] ?? "0", 10);
		if (charToUpperCase > 0 && charToUpperCase <= (fixHints.exportCodeToBeUsed?.args?.[0] ?? "").length) {
			fixHints = undefined; // We cannot handle this case
		}
	} else if (apiName === "control" && fixHints.moduleName === "sap/ui/core/Element") {
		const {args} = fixHints.exportCodeToBeUsed;
		if (args && args.length === 1) {
			// Default case. No needed to be handled specifically.
		} else if (args && args.length === 2) {
			fixHints.exportCodeToBeUsed.name = "$moduleIdentifier.closestTo($1)";
		} else if (args && args.length === 3) {
			fixHints.exportCodeToBeUsed.name = "$moduleIdentifier.closestTo($1, $3)";
		} else {
			fixHints.exportCodeToBeUsed = undefined; // We don't want to process in such a case
		}
	} else if (["jQuery.sap.setObject", "jQuery.sap.getObject"].includes(apiName ?? "")) {
		fixHints.exportCodeToBeUsed.args ??= [];
		if (!fixHints.exportCodeToBeUsed.args?.length ||
			!fixHints.exportCodeToBeUsed.args[0] ||
			["undefined", "null"].includes(fixHints.exportCodeToBeUsed.args[0])) {
			fixHints.exportCodeToBeUsed.args[0] = "\"\"";
		}
		if (apiName === "jQuery.sap.setObject") {
			// Cleanup the code to prevent unnecessary write of undefined values
			fixHints.exportCodeToBeUsed.name =
				`$moduleIdentifier.set(${cleanRedundantArguments(fixHints.exportCodeToBeUsed.args)})`;
		}
	} else if (apiName === "jQuery.sap.getModulePath") {
		if (fixHints.exportCodeToBeUsed.args?.[0] && /^"(.*)"$/g.exec(fixHints.exportCodeToBeUsed.args[0])) {
			fixHints.exportCodeToBeUsed.args[0] = fixHints.exportCodeToBeUsed.args[0].replaceAll(".", "/");

			if (fixHints.exportCodeToBeUsed.args?.[1]) {
				fixHints.exportCodeToBeUsed.name = "sap.ui.require.toUrl($1 + $2)";
			}
		} else {
			fixHints = undefined; // We cannot handle this case
		}
	} else if (apiName === "jQuery.sap.extend") {
		const args = fixHints.exportCodeToBeUsed.args ?? [];
		const isObject = /^\{.*\}/g;
		const isArray = /^\[.*\]/g;

		if (["true", "null", "undefined"].includes(args[0]) ||
			(args.length === 2 && isArray.exec(args[0])) ||
			(args.length === 3 && isArray.exec(args[1]))) {
			// Deep clone
			fixHints.exportCodeToBeUsed.name =
				`$moduleIdentifier(${cleanRedundantArguments(fixHints.exportCodeToBeUsed.args ?? [])})`;
		} else if (args.length === 2 && isObject.exec(args[0])) {
			fixHints.exportCodeToBeUsed.name = `{...$1, ...$2}`;
			delete fixHints.moduleName;
		} else if (args.length === 3 && isObject.exec(args[1])) {
			fixHints.exportCodeToBeUsed.name = `{...$2, ...$3}`;
			delete fixHints.moduleName;
		} else {
			fixHints = undefined; // Too much uncertainty. We cannot process this case
			log.verbose(`Autofix skipped for jQuery.sap.extend. Transpilation is too ambiguous.`);
		}
	} else if (["jQuery.sap.delayedCall", "jQuery.sap.intervalCall"].includes(apiName ?? "")) {
		const args = fixHints.exportCodeToBeUsed.args ?? [];
		if (args.length < 3) {
			fixHints = undefined; // We don't know how to handle this case
			log.verbose(`Autofix skipped for ${apiName}. Transpilation is too ambiguous.`);
			return fixHints;
		}

		let fnBinding = "$3.bind($2)";
		if (/^("|'|`).*("|'|`)$/g.exec(args[2])) {
			fnBinding = "$2[$3].bind($2)";
		}

		const apiCall = apiName === "jQuery.sap.delayedCall" ? "setTimeout" : "setInterval";
		const callArgs = args.length > 3 ? `, ...$4` : "";
		fixHints.exportCodeToBeUsed.name =
			`window.${apiCall}(${fnBinding}, $1${callArgs})`;
	}

	return fixHints;
}

function cleanRedundantArguments(availableArgs: string[]) {
	const args = [];
	for (let i = 1; i <= availableArgs.length; i++) {
		args.push(`$${i}`);
	}

	return args.join(", ");
}
