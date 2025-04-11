import ts from "typescript";
import {RawLintMessage} from "../../linter/LinterContext.js";
import {
	ChangeAction,
	type ImportRequests,
	type ChangeSet,
} from "../autofix.js";
import {type FixHints} from "../../linter/ui5Types/FixHintsGenerator.js";

export default function generateSolutionCodeReplacer(
	importRequests: ImportRequests, messages: RawLintMessage[], changeSet: ChangeSet[], sourceFile: ts.SourceFile) {
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

		const value = exportCodeToBeUsed.args?.reduce((acc, arg, index) => {
			return acc?.replace(`$${index + 1}`, patchArguments(arg, apiName));
		}, exportCodeToBeUsed.name ?? "") ?? exportCodeToBeUsed.name;

		// Calculate the replacement position
		// It cannot be derived from the fixHintsGenerator as it works on the compiled source file.
		// Just take the length of the old and the original start position
		const line = position.line - 1;
		const column = position.column - 1;
		const start = sourceFile.getPositionOfLineAndCharacter(line, column);
		const end = start + exportCodeToBeUsed.solutionLength;

		changeSet.push({
			action: ChangeAction.REPLACE,
			start,
			end,
			value,
		});
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
	if (apiName !== "jQuery.sap.getUriParameters" ||
		!fixHints || !("exportCodeToBeUsed" in fixHints) ||
		!fixHints.exportCodeToBeUsed ||
		!(typeof fixHints.exportCodeToBeUsed === "object") ||
		!fixHints.exportCodeToBeUsed.args?.length) {
		return fixHints;
	}

	const isQueryStringRegex = /\?[^\s#]+/g;
	if (isQueryStringRegex.test(fixHints.exportCodeToBeUsed.args[0])) {
		fixHints.exportCodeToBeUsed.name = "new URL($1).searchParams";
	}

	return fixHints;
}
