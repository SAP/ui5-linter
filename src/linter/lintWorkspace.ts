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
import {createReader, createResource} from "@ui5/fs/resourceFactory";
import {mergeIgnorePatterns, resolveReader} from "./linter.js";
import {UI5LintConfigType} from "../utils/ConfigManager.js";
import type SharedLanguageService from "./ui5Types/SharedLanguageService.js";
import autofix, {AutofixResource} from "../autofix/autofix.js";
import {writeFile} from "node:fs/promises";
import {FSToVirtualPathOptions, transformVirtualPathToFilePath} from "../utils/virtualPathToFilePath.js";

export default async function lintWorkspace(
	workspace: AbstractAdapter, filePathsWorkspace: AbstractAdapter,
	options: LinterOptions & FSToVirtualPathOptions, config: UI5LintConfigType, patternsMatch: Set<string>,
	sharedLanguageService: SharedLanguageService
): Promise<LintResult[]> {
	let context = await runLintWorkspace(
		workspace, filePathsWorkspace, options, config, patternsMatch, sharedLanguageService
	);

	if (options.fix) {
		const rawLintResults = context.generateRawLintResults();

		const autofixResources = new Map<string, AutofixResource>();
		for (const {filePath, rawMessages} of rawLintResults) {
			// FIXME: handle this the same way as we already do for the general results
			const resource = await workspace.byPath(filePath);
			const content = await resource.getString();
			autofixResources.set(filePath, {
				content,
				messages: rawMessages,
			});
		}

		const autofixResult = await autofix({
			rootDir: options.rootDir,
			namespace: options.namespace,
			resources: autofixResources,
			context,
		});

		if (autofixResult.size > 0) {
			for (const [filePath, content] of autofixResult.entries()) {
				const newResource = createResource({
					path: filePath,
					string: content,
				});
				await workspace.write(newResource);
				await filePathsWorkspace.write(newResource);
			}

			// Run lint again after fixes are applied
			context = await runLintWorkspace(
				workspace, filePathsWorkspace, options, config, patternsMatch, sharedLanguageService
			);

			// Update fixed files on the filesystem
			const autofixFiles = Array.from(autofixResult.entries());
			await Promise.all(autofixFiles.map(async ([filePath, content]) => {
				const realFilePath = transformVirtualPathToFilePath(filePath, options);
				await writeFile(realFilePath, content);
			}));
		}
	}

	return context.generateLintResults();
}

async function runLintWorkspace(
	workspace: AbstractAdapter, filePathsWorkspace: AbstractAdapter,
	options: LinterOptions & FSToVirtualPathOptions, config: UI5LintConfigType, patternsMatch: Set<string>,
	sharedLanguageService: SharedLanguageService
): Promise<LinterContext> {
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
	return context;
}
