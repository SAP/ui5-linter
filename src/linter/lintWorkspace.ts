import {AbstractAdapter} from "@ui5/fs";
import lintXml from "./xmlTemplate/linter.js";
import lintJson from "./manifestJson/linter.js";
import lintHtml from "./html/linter.js";
import lintUI5Yaml from "./yaml/linter.js";
import lintDotLibrary from "./dotLibrary/linter.js";
import lintFileTypes from "./fileTypes/linter.js";
import {taskStart} from "../utils/perf.js";
import TypeLinter from "./ui5Types/TypeLinter.js";
import LinterContext, {LintResult, LinterParameters, LinterOptions} from "./LinterContext.js";
import {createReader} from "@ui5/fs/resourceFactory";
import {resolveReader} from "./linter.js";
import {UI5LintConfigType} from "../utils/ConfigManager.js";

export default async function lintWorkspace(
	workspace: AbstractAdapter, options: LinterOptions, config: UI5LintConfigType
): Promise<LintResult[]> {
	const done = taskStart("Linting Workspace");

	const context = new LinterContext(options);
	let reader = await resolveReader(
		options.filePatterns ?? [],
		options.rootDir,
		createReader({
			fsBasePath: options.rootDir,
			virBasePath: "/",
		}),
		config
	);
	reader = await resolveReader(options.ignorePattern ?? [], options.rootDir, reader);
	context.setRootReader(reader);

	const params: LinterParameters = {
		workspace, context,
	};

	await Promise.all([
		lintXml(params),
		lintJson(params),
		lintHtml(params),
		lintUI5Yaml(params),
		lintDotLibrary(params),
		lintFileTypes(params),
	]);

	const typeLinter = new TypeLinter(params);
	await typeLinter.lint();
	done();
	return context.generateLintResults();
}
