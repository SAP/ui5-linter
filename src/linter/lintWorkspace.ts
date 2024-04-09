import {AbstractAdapter} from "@ui5/fs";
import lintXml from "./xmlTemplate/linter.js";
import lintJson from "./manifestJson/linter.js";
import lintHtml from "./html/linter.js";
import {taskStart} from "../util/perf.js";
import TypeLinter from "./ui5Types/TypeLinter.js";
import LinterContext, {LintResult, LinterParameters, LinterOptions} from "./LinterContext.js";

export default async function lintWorkspace(
	workspace: AbstractAdapter, options: LinterOptions
): Promise<LintResult[]> {
	const done = taskStart("Linting Workspace");

	const context = new LinterContext(options);
	const params: LinterParameters = {
		workspace, context,
	};

	await Promise.all([
		lintXml(params),
		lintJson(params),
		lintHtml(params),
	]);

	const typeLinter = new TypeLinter(params);
	await typeLinter.lint();
	done();
	return context.generateLintResults();
}
