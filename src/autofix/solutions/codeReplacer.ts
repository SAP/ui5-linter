import ts from "typescript";
import {RawLintMessage} from "../../linter/LinterContext.js";
import {
	ChangeAction,
	type ImportRequests,
	type ChangeSet,
} from "../autofix.js";

export default function generateSolutionCodeReplacer(
	importRequests: ImportRequests, messages: RawLintMessage[], changeSet: ChangeSet[], sourceFile: ts.SourceFile) {
	for (const {fixHints, position} of messages) {
		if (!fixHints || !("exportCodeToBeUsed" in fixHints) ||
			!fixHints.exportCodeToBeUsed || !(typeof fixHints.exportCodeToBeUsed === "object") ||
			!position) {
			continue;
		}

		const {exportCodeToBeUsed, moduleName} = fixHints;
		const moduleInfo = moduleName ? importRequests.get(moduleName) : null;
		if (moduleInfo?.identifier) {
			exportCodeToBeUsed.name =
				exportCodeToBeUsed.name.replaceAll("$moduleIdentifier", moduleInfo.identifier);
		}

		const value = exportCodeToBeUsed.args?.reduce((acc, arg, index) => {
			return acc?.replace(`$${index + 1}`, arg);
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
