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
	workspace: AbstractAdapter, filePathsReader: AbstractAdapter,
	options: LinterOptions, config: UI5LintConfigType
): Promise<LintResult[]> {
	const done = taskStart("Linting Workspace");

	const context = new LinterContext(options);
	let reader = await resolveReader({
		patterns: options.filePatterns ?? [],
		projectRootDir: options.rootDir,
		ui5ConfigPath: config.ui5Config,
		resourceReader: createReader({
			fsBasePath: options.rootDir,
			virBasePath: "/",
		}),
		inverseResult: true,
		namespace: options.namespace,
	});
	reader = await resolveReader({
		patterns: options.ignorePattern ?? [],
		projectRootDir: options.rootDir,
		ui5ConfigPath: config.ui5Config,
		resourceReader: reader,
		namespace: options.namespace,
	});
	context.setRootReader(reader);

	const params: LinterParameters = {
		workspace, filePathsReader, context,
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
