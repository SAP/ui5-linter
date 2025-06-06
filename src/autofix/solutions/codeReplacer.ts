import ts, {SyntaxKind} from "typescript";
import {type PositionInfo, type RawLintMessage} from "../../linter/LinterContext.js";
import {
	ChangeAction,
	type ChangeSet,
	type ReplaceChange,
	type ExistingModuleDeclarationInfo,
	getModuleDeclarationForPosition,
	DeprecatedApiAccessNode,
	GlobalPropertyAccessNodeInfo,
} from "../autofix.js";
import {ExportCodeToBeUsed, type FixHints} from "../../linter/ui5Types/fixHints/FixHints.js";
import {resolveUniqueName} from "../../linter/ui5Types/utils/utils.js";
import {getLogger} from "@ui5/logger";

const log = getLogger("linter:autofix:codeReplacer");

function findNodeInfoAtPosition(
	nodeInfos: (DeprecatedApiAccessNode | GlobalPropertyAccessNodeInfo)[],
	position: PositionInfo
): DeprecatedApiAccessNode | GlobalPropertyAccessNodeInfo | undefined {
	return nodeInfos.find((nodeInfo) => {
		return nodeInfo.position.line === (position.line - 1) &&
			nodeInfo.position.column === (position.column - 1);
	});
}

function replaceCodePlaceholders(
	exportCodeToBeUsed: ExportCodeToBeUsed
) {
	return exportCodeToBeUsed.name.replace(/\$(\d+)/g, (match: string, group1: string) => {
		const argIndex = parseInt(group1);
		if (isNaN(argIndex) || argIndex < 1 || argIndex > (exportCodeToBeUsed.args?.length ?? 0)) {
			return match;
		}
		const arg = exportCodeToBeUsed.args?.[argIndex - 1];
		if (arg) {
			return arg.value;
		} else {
			return match;
		}
	});
}

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
		const moduleDeclaration = getModuleDeclarationForPosition(
			sourceFile.getPositionOfLineAndCharacter(position.line - 1, position.column - 1),
			moduleDeclarations
		);

		// Message is not in the context of a module declaration (e.g. top-level code)
		if (!moduleDeclaration) {
			log.verbose(`Autofix skipped for message: ${JSON.stringify({fixHints, position, args})}`);
			continue;
		}

		const importRequests = moduleDeclaration.importRequests;

		const {exportCodeToBeUsed, moduleName} = patchedFixHints;
		const moduleInfo = moduleName ? importRequests?.get(moduleName) : null;
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

		const value = replaceCodePlaceholders(exportCodeToBeUsed);

		let nodeInfo: DeprecatedApiAccessNode | GlobalPropertyAccessNodeInfo | undefined;
		if (moduleInfo?.nodeInfos) {
			nodeInfo = findNodeInfoAtPosition(moduleInfo.nodeInfos, position);
		} else if (moduleDeclaration.additionalNodeInfos) {
			nodeInfo = findNodeInfoAtPosition(moduleDeclaration.additionalNodeInfos, position);
		}

		if (!nodeInfo?.node) {
			throw new Error(`Unable to produce solution for message: ${JSON.stringify({fixHints, position, args})}`);
		}

		// Calculate the replacement position
		// It cannot be derived from the fixHintsGenerator as it works on the compiled source file.
		// Just take the length of the old and the original start position
		let originalLengthNode = nodeInfo.node;

		if (ts.isCallExpression(nodeInfo.node.parent) &&
			nodeInfo.node.parent.expression === nodeInfo.node) {
			originalLengthNode = nodeInfo.node.parent;
		}
		const start = originalLengthNode.getStart();
		const end = originalLengthNode.getEnd();

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

function patchMessageFixHints(fixHints?: FixHints, apiName?: string) {
	if (!fixHints || !("exportCodeToBeUsed" in fixHints) ||
		!fixHints.exportCodeToBeUsed ||
		!(typeof fixHints.exportCodeToBeUsed === "object")) {
		return fixHints;
	}

	if (apiName?.startsWith("jQuery.sap.charToUpperCase")) {
		// If no position is given or when it is negative or beyond the last character
		// of the given string, the first character will be converted to upper case.
		const charToUpperCase = parseInt(fixHints.exportCodeToBeUsed?.args?.[1]?.value ?? "0", 10);
		const isStringValue = fixHints.exportCodeToBeUsed?.args?.[0]?.kind === SyntaxKind.StringLiteral;
		if (!isStringValue ||
			(charToUpperCase > 0 && charToUpperCase <= (fixHints.exportCodeToBeUsed?.args?.[0].value ?? "").length)) {
			fixHints = undefined; // We cannot handle this case
			log.verbose(`Autofix skipped for jQuery.sap.charToUpperCase. Transpilation is too ambiguous.`);
		}
	} else if (apiName === "jQuery.sap.setObject") {
		fixHints.exportCodeToBeUsed.args ??= [];
		if (!fixHints.exportCodeToBeUsed.args?.length ||
			!fixHints.exportCodeToBeUsed.args[0] ||
			["undefined", "null"].includes(fixHints.exportCodeToBeUsed.args[0].value)) {
			if (!fixHints.exportCodeToBeUsed.args.length) {
				fixHints.exportCodeToBeUsed.args = [{value: "\"\"", kind: SyntaxKind.UndefinedKeyword}];
			}
			fixHints.exportCodeToBeUsed.args[0].value = "\"\"";
		}
		// Cleanup the code to prevent unnecessary write of undefined values
		fixHints.exportCodeToBeUsed.name =
			`$moduleIdentifier.set(${cleanRedundantArguments(fixHints.exportCodeToBeUsed.args)})`;
	} else if (apiName === "jQuery.sap.getModulePath") {
		if (fixHints.exportCodeToBeUsed.args?.[0]?.kind === SyntaxKind.StringLiteral) {
			fixHints.exportCodeToBeUsed.args[0].value = fixHints.exportCodeToBeUsed.args[0].value.replaceAll(".", "/");
		} else {
			fixHints.exportCodeToBeUsed.name = `sap.ui.require.toUrl(($1)?.replaceAll(".", "/"))`;
		}

		if (fixHints.exportCodeToBeUsed.args?.[1]) {
			fixHints.exportCodeToBeUsed.name += " + $2";
		}
	} else if (apiName === "jQuery.sap.getResourcePath" && fixHints.exportCodeToBeUsed.args?.[1]) {
		fixHints.exportCodeToBeUsed.name += " + $2";
	} else if (apiName === "jQuery.sap.extend") {
		// Only explicit deep merge can be safely migrated
		if (fixHints.exportCodeToBeUsed.args?.[0]?.kind !== SyntaxKind.TrueKeyword) {
			fixHints = undefined; // Too much uncertainty. We cannot process this case
			log.verbose(`Autofix skipped for jQuery.sap.extend. Transpilation is too ambiguous.`);
		}
	} else if (apiName === "jQuery.sap.newObject") {
		if (!fixHints.exportCodeToBeUsed.args?.length) {
			fixHints.exportCodeToBeUsed.name = "Object.create(null)";
		} else if (
			![SyntaxKind.ObjectLiteralExpression, SyntaxKind.NullKeyword]
				.includes(fixHints.exportCodeToBeUsed.args[0].kind)) {
			fixHints.exportCodeToBeUsed.name = "Object.create($1 || null)";
		}
	} else if (apiName === "jQuery.sap.domById") {
		if (!fixHints.exportCodeToBeUsed.args?.length ||
			fixHints.exportCodeToBeUsed.args[0].value === ""
		) {
			fixHints.exportCodeToBeUsed.name = "null";
		} else if (fixHints.exportCodeToBeUsed.args[1]) {
			fixHints.exportCodeToBeUsed.name = `$2.document.getElementById($1)`;
		}
	} else if (["jQuery.sap.registerResourcePath", "jQuery.sap.registerModulePath"].includes(apiName ?? "")) {
		if (fixHints.exportCodeToBeUsed.args?.[0]?.kind === SyntaxKind.StringLiteral) {
			fixHints.exportCodeToBeUsed.args[0].value =
				fixHints.exportCodeToBeUsed.args[0].value.replaceAll(".", "/");
		} else {
			fixHints.exportCodeToBeUsed.name = `sap.ui.loader.config({paths: {[$1.replaceAll(".", "/")]: $2}})`;
		}

		if (fixHints.exportCodeToBeUsed.args?.[1]?.kind === SyntaxKind.ObjectLiteralExpression) {
			const arg = fixHints.exportCodeToBeUsed.args[1]?.value;
			const matcher = /(?:['"]?\b(?:path|url)\b['"]?\s*:\s*)(['"][^'"]+['"])/;
			const match = matcher.exec(arg);
			fixHints.exportCodeToBeUsed.args[1].value = match?.[1] ?? arg;
		} else if (fixHints.exportCodeToBeUsed.args?.[1]?.kind !== SyntaxKind.StringLiteral) {
			fixHints = undefined; // We don't know how to handle this case
			log.verbose(`Autofix skipped for ${apiName}. Transpilation is too ambiguous.`);
		}
	} else if ([
		"jQuery.sap.startsWith",
		"jQuery.sap.startsWithIgnoreCase",
		"jQuery.sap.endsWith",
		"jQuery.sap.endsWithIgnoreCase",
	].includes(apiName ?? "")) {
		if (fixHints?.exportCodeToBeUsed?.args?.[0] &&
			fixHints.exportCodeToBeUsed.args[0].kind !== SyntaxKind.StringLiteral &&
			// Special case, throws an exception and is expected effect
			fixHints.exportCodeToBeUsed.args[0].kind !== SyntaxKind.NullKeyword) {
			fixHints.exportCodeToBeUsed.args[0].value = `(${fixHints.exportCodeToBeUsed.args[0].value} || "")`;
		}
		if (["jQuery.sap.startsWithIgnoreCase", "jQuery.sap.endsWithIgnoreCase"].includes(apiName ?? "") &&
			fixHints?.exportCodeToBeUsed?.args?.[1] &&
			fixHints?.exportCodeToBeUsed.args[1].kind !== SyntaxKind.StringLiteral) {
			if ([SyntaxKind.NumericLiteral, SyntaxKind.NullKeyword]
				.includes(fixHints.exportCodeToBeUsed.args[1].kind)) {
				fixHints.exportCodeToBeUsed.args[1].value = `"${fixHints.exportCodeToBeUsed.args[1].value}"`;
			} else {
				fixHints.exportCodeToBeUsed.args[1].value = `(${fixHints.exportCodeToBeUsed.args[1].value} || "")`;
			}
		}

		// If there are no arguments, we cannot migrate.
		// If the second argument is an empty string, we can't migrate as the built-in String API
		// returns true instead of false in that case.
		// For this reason, we can only safely replace a call when the second argument is a non-empty string.
		if (
			!fixHints.exportCodeToBeUsed.args?.length ||
			fixHints?.exportCodeToBeUsed?.args?.[1]?.kind !== SyntaxKind.StringLiteral ||
			["", "\"\"", "''"].includes(fixHints.exportCodeToBeUsed.args[1].value)
		) {
			fixHints = undefined; // API not compatible
		}
	} else if ([
		"jQuery.sap.padLeft",
		"jQuery.sap.padRight",
	].includes(apiName ?? "")) {
		if (fixHints?.exportCodeToBeUsed?.args?.[0] &&
			fixHints.exportCodeToBeUsed.args[0].kind !== SyntaxKind.StringLiteral) {
			fixHints.exportCodeToBeUsed.args[0].value = `(${fixHints.exportCodeToBeUsed.args[0].value} || "")`;
		}
		if (!fixHints?.exportCodeToBeUsed?.args?.[1] ||
			fixHints?.exportCodeToBeUsed.args[1].kind !== SyntaxKind.StringLiteral ||
			// String literals are enclosed in double quotes, so the length of an empty string is 2
			fixHints?.exportCodeToBeUsed.args[1].value.length > 3) {
			// API not compatible if the second argument is not a string or string with lenght <> 1
			fixHints = undefined;
			log.verbose(`Autofix skipped for ${apiName}.`);
		}
	} else if ([
		"jQuery.sap.log.debug",
		"jQuery.sap.log.error",
		"jQuery.sap.log.fatal",
		"jQuery.sap.log.info",
		"jQuery.sap.log.trace",
		"jQuery.sap.log.warning",
	].includes(apiName ?? "")) {
		if (fixHints?.exportCodeToBeUsed.isExpectedValue) {
			// API not compatible
			fixHints = undefined;
			log.verbose(`Autofix skipped for ${apiName}.`);
		} else {
			const fnName = apiName?.split(".").pop() ?? "";
			if (fnName && fixHints && typeof fixHints.exportCodeToBeUsed === "object" &&
				fixHints.exportCodeToBeUsed.args) {
				fixHints.exportCodeToBeUsed.name =
					`$moduleIdentifier.${fnName}(${cleanRedundantArguments(fixHints.exportCodeToBeUsed.args)})`;
			}
		}
	} else if ([
		"setCalendarType",
		"setCalendarWeekNumbering",
		"setFormatLocale",
		"setLanguage",
		"setRTL",
		"setTheme",
		"setTimezone",
	].includes(apiName ?? "") &&
	[
		"sap/base/i18n/Formatting",
		"sap/base/i18n/Localization",
		"sap/ui/core/Theming",
	].includes(fixHints?.moduleName ?? "")) {
		if (fixHints?.exportCodeToBeUsed.isExpectedValue) {
			// API not compatible
			fixHints = undefined;
			log.verbose(`Autofix skipped for ${apiName}.`);
		} else {
			const fnName = apiName ?? "";
			if (fnName && fixHints && typeof fixHints.exportCodeToBeUsed === "object" &&
				fixHints.exportCodeToBeUsed.args) {
				fixHints.exportCodeToBeUsed.name =
					`$moduleIdentifier.${fnName}(${cleanRedundantArguments(fixHints.exportCodeToBeUsed.args)})`;
			}
		}
	}

	return fixHints;
}

function cleanRedundantArguments(availableArgs: {value: string}[]) {
	const args = [];
	for (let i = 1; i <= availableArgs.length; i++) {
		args.push(`$${i}`);
	}

	return args.join(", ");
}
