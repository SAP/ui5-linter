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
import {mergeIgnorePatterns, resolveReader} from "./linter.js";
import {UI5LintConfigType} from "../utils/ConfigManager.js";
import type SharedLanguageService from "./ui5Types/SharedLanguageService.js";
import type {FSToVirtualPathOptions} from "../utils/virtualPathToFilePath.js";

export default async function lintWorkspace(
	workspace: AbstractAdapter, filePathsWorkspace: AbstractAdapter,
	options: LinterOptions & FSToVirtualPathOptions, config: UI5LintConfigType, patternsMatch: Set<string>,
	sharedLanguageService: SharedLanguageService
): Promise<LintResult[]> {
	const done = taskStart("Linting Workspace");
	const fsToVirtualPathOptions = {
		relFsBasePath: options.relFsBasePath ?? "",
		virBasePath: options.virBasePath ?? "/",
		relFsBasePathTest: options.relFsBasePathTest,
		virBasePathTest: options.virBasePathTest,
	};

	const context = new LinterContext(options);
	let reader = resolveReader({
		patterns: options.filePatterns ?? config.files ?? [],
		fsToVirtualPathOptions,
		resourceReader: createReader({
			fsBasePath: options.rootDir,
			virBasePath: "/",
		}),
		inverseResult: true,
		patternsMatch,
	});
	reader = resolveReader({
		patterns: mergeIgnorePatterns(options, config),
		resourceReader: reader,
		patternsMatch,
		fsToVirtualPathOptions,
	});
	context.setRootReader(reader);

	const params: LinterParameters = {
		workspace, filePathsWorkspace, context,
	};

	await Promise.all([
		lintXml(params),
		lintJson(params),
		lintHtml(params),
		lintUI5Yaml(params),
		lintDotLibrary(params),
		lintFileTypes(params),
	]);

	const typeLinter = new TypeLinter(params, sharedLanguageService);
	await typeLinter.lint();
	done();
	return context.generateLintResults();
}
