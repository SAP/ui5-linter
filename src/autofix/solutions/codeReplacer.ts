import ts from "typescript";
import {RawLintMessage} from "../../linter/LinterContext.js";
import {
	ChangeAction,
	type ImportRequests,
	type ChangeSet,
	type ReplaceChange,
} from "../autofix.js";
import {type FixHints} from "../../linter/ui5Types/FixHintsGenerator.js";
import {resolveUniqueName} from "../../linter/ui5Types/utils/utils.js";

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
	importRequests: ImportRequests, messages: RawLintMessage[],
	changeSet: ChangeSet[], sourceFile: ts.SourceFile, declaredIdentifiers: Set<string>) {
	for (const {fixHints, position, args} of messages) {
		const apiName = "apiName" in args ? args.apiName : undefined;
		const patchedFixHints = patchMessageFixHints(fixHints, apiName);

		if (!patchedFixHints || !("exportCodeToBeUsed" in patchedFixHints) ||
			!patchedFixHints.exportCodeToBeUsed || !(typeof patchedFixHints.exportCodeToBeUsed === "object") ||
			!position) {
			continue;
		}

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

		const value = exportCodeToBeUsed.args?.reduce((acc, arg, index) => {
			return acc?.replace(new RegExp(`\\$${index + 1}(?!\\d)`, "g"), patchArguments(arg, apiName));
		}, exportCodeToBeUsed.name ?? "") ?? exportCodeToBeUsed.name;

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

	if (apiName === "jQuery.sap.getUriParameters" && fixHints.exportCodeToBeUsed.args?.length) {
		const isQueryStringRegex = /\?[^\s#]+/g;
		if (isQueryStringRegex.test(fixHints.exportCodeToBeUsed.args[0])) {
			fixHints.exportCodeToBeUsed.name = "new URL($1).searchParams";
		}
	} else if (apiName?.startsWith("jQuery.sap.keycodes")) {
		fixHints.exportCodeToBeUsed.name = apiName.replace("jQuery.sap.keycodes", "$moduleIdentifier");
	} else if (apiName?.startsWith("jQuery.sap.PseudoEvents")) {
		fixHints.exportCodeToBeUsed.name = apiName.replace("jQuery.sap.PseudoEvents", "$moduleIdentifier");
	} else if (apiName?.startsWith("jQuery.sap.charToUpperCase")) {
		// If no position is given or when it is negative or beyond the last character
		// of the given string, the first character will be converted to upper case.
		const charToUpperCase = parseInt(fixHints.exportCodeToBeUsed?.args?.[1] ?? "0", 10);
		if (charToUpperCase <= 0 || charToUpperCase > (fixHints.exportCodeToBeUsed?.args?.[0] ?? "").length) {
			fixHints.exportCodeToBeUsed.args = [
				fixHints.exportCodeToBeUsed.args?.[0] ?? "",
				"0",
			];
		}
	}

	return fixHints;
}
