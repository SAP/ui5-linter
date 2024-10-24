import {graphFromObject} from "@ui5/project/graph";
import {createReader, createWorkspace, createReaderCollection, createFilterReader} from "@ui5/fs/resourceFactory";
import {FilePath, FilePattern, LinterOptions, FSToVirtualPathOptions, LintResult} from "./LinterContext.js";
import lintWorkspace from "./lintWorkspace.js";
import {taskStart} from "../utils/perf.js";
import path from "node:path";
import posixPath from "node:path/posix";
import {stat} from "node:fs/promises";
import {ProjectGraph} from "@ui5/project";
import type {AbstractReader, Resource} from "@ui5/fs";
import ConfigManager, {UI5LintConfigType} from "../utils/ConfigManager.js";
import {Minimatch} from "minimatch";

// Internal analytical variable that will store matchers' count.
// We cannot predict the outcome of the matchers, so stash usage statistics
// and later analyze the results from it.
const matchedPatterns = new Set<string>();

export async function lintProject({
	rootDir, filePatterns, ignorePattern, reportCoverage, includeMessageDetails, configPath, ui5ConfigPath,
}: LinterOptions): Promise<LintResult[]> {
	const configMngr = new ConfigManager(rootDir, configPath);
	const config = await configMngr.getConfiguration();

	// In case path is set both by CLI and config use CLI
	ui5ConfigPath = ui5ConfigPath ?? config.ui5Config;

	const projectGraphDone = taskStart("Project Graph creation");
	const graph = await getProjectGraph(rootDir, ui5ConfigPath);
	const project = graph.getRoot();
	projectGraphDone();

	let virBasePath = "/resources/";
	if (!project._isSourceNamespaced) {
		// Ensure the virtual filesystem includes the project namespace to allow relative imports
		// of framework resources from the project
		virBasePath += project.getNamespace() + "/";
	}
	const fsBasePath = project.getSourcePath();
	let reader = createReader({
		fsBasePath,
		virBasePath,
	});
	let virBasePathTest: string | undefined;
	let fsBasePathTest: string | undefined;
	if (project._testPathExists) {
		fsBasePathTest = path.join(project.getRootPath(), project._testPath);
		virBasePathTest = "/test-resources/";
		if (!project._isSourceNamespaced) {
			// Dynamically add namespace if the physical project structure does not include it
			// This logic is identical to the specification implementation in ui5-project
			virBasePathTest += project.getNamespace() + "/";
		}
		reader = createReaderCollection({
			readers: [reader, createReader({
				fsBasePath: fsBasePathTest,
				virBasePath: virBasePathTest,
			})],
		});
	}

	const relFsBasePath = path.relative(rootDir, fsBasePath);
	const relFsBasePathTest = fsBasePathTest ? path.relative(rootDir, fsBasePathTest) : undefined;

	const res = await lint(reader, {
		rootDir,
		namespace: project.getNamespace(),
		filePatterns,
		ignorePattern,
		reportCoverage,
		includeMessageDetails,
		configPath,
		relFsBasePath, virBasePath, relFsBasePathTest, virBasePathTest,
	}, config);

	res.forEach((result) => {
		result.filePath = transformVirtualPathToFilePath(result.filePath,
			relFsBasePath, virBasePath,
			relFsBasePathTest, virBasePathTest);
	});
	// Sort by filePath after the virtual path has been converted back to ensure deterministic and sorted output.
	// Differences in order can happen as different linters (e.g. xml, json, html, ui5.yaml) are executed in parallel.
	sortLintResults(res);
	return res;
}

export async function lintFile({
	rootDir, filePatterns, ignorePattern, namespace, reportCoverage, includeMessageDetails, configPath,
}: LinterOptions): Promise<LintResult[]> {
	const configMngr = new ConfigManager(rootDir, configPath);
	const config = await configMngr.getConfiguration();

	const virBasePath = namespace ? `/resources/${namespace}/` : "/";
	const reader = createReader({
		fsBasePath: rootDir,
		virBasePath,
	});

	const res = await lint(reader, {
		rootDir,
		namespace,
		filePatterns,
		ignorePattern,
		reportCoverage,
		includeMessageDetails,
		configPath,
		relFsBasePath: "",
		virBasePath,
	}, config);

	res.forEach((result) => {
		result.filePath = transformVirtualPathToFilePath(result.filePath, "", "/");
	});
	// Sort by filePath after the virtual path has been converted back to ensure deterministic and sorted output.
	// Differences in order can happen as different linters (e.g. xml, json, html, ui5.yaml) are executed in parallel.
	sortLintResults(res);
	return res;
}

async function lint(
	resourceReader: AbstractReader, options: LinterOptions & FSToVirtualPathOptions,
	config: UI5LintConfigType
): Promise<LintResult[]> {
	const lintEnd = taskStart("Linting");
	let {ignorePattern, filePatterns} = options;
	const {relFsBasePath, virBasePath, relFsBasePathTest, virBasePathTest} = options;

	// Resolve files to include
	filePatterns = filePatterns ?? config.files ?? [];

	// Resolve ignores
	ignorePattern = [
		...(config.ignores ?? []),
		...(ignorePattern ?? []), // CLI patterns go after config patterns
	].filter(($) => $);
	// Apply ignores to the workspace reader.
	// TypeScript needs the full context to provide correct analysis.
	// so, we can do filtering later via the filePathsReader
	const reader = resolveReader({
		patterns: ignorePattern,
		resourceReader,
		patternsMatch: matchedPatterns,
		relFsBasePath, virBasePath, relFsBasePathTest, virBasePathTest,
	});

	// Apply files + ignores over the filePaths reader
	let filePathsReader = resolveReader({
		patterns: filePatterns,
		resourceReader,
		inverseResult: true,
		patternsMatch: matchedPatterns,
		relFsBasePath, virBasePath, relFsBasePathTest, virBasePathTest,
	});
	filePathsReader = resolveReader({
		patterns: ignorePattern,
		resourceReader: filePathsReader,
		patternsMatch: matchedPatterns,
		relFsBasePath, virBasePath, relFsBasePathTest, virBasePathTest,
	});
	const filePathsWorkspace = createWorkspace({reader: filePathsReader});

	const workspace = createWorkspace({
		reader,
	});

	const res = await lintWorkspace(workspace, filePathsWorkspace, options, config, matchedPatterns);
	checkUnmatchedPatterns(filePatterns, matchedPatterns);

	lintEnd();
	return res;
}

async function getProjectGraph(rootDir: string, ui5ConfigPath?: string): Promise<ProjectGraph> {
	let rootConfigPath, rootConfiguration;
	const ui5YamlPath = ui5ConfigPath ? path.join(rootDir, ui5ConfigPath) : path.join(rootDir, "ui5.yaml");
	if (await fileExists(ui5YamlPath)) {
		rootConfigPath = ui5YamlPath;
	} else {
		if (ui5ConfigPath) throw new Error(`Unable to find UI5 config file '${ui5ConfigPath}'`);
		const isApp = await dirExists(path.join(rootDir, "webapp"));
		if (isApp) {
			rootConfiguration = {
				specVersion: "3.0",
				type: "application",
				metadata: {
					name: "ui5-linter-target",
				},
			};
		} else {
			const isLibrary = await dirExists(path.join(rootDir, "src"));
			if (isLibrary) {
				rootConfiguration = {
					specVersion: "3.0",
					type: "library",
					metadata: {
						name: "ui5-linter-target",
					},
				};
			}
		}
	}

	if (!rootConfigPath && !rootConfiguration) {
		throw new Error(
			`Unable to find a UI5 project at ${rootDir}. \n` +
			`Please make sure to run "ui5lint" in the root directory of your UI5 project.`
		);
	}

	return graphFromObject({
		dependencyTree: {
			id: "ui5-linter-target",
			version: "1.0.0",
			path: rootDir,
			dependencies: [],
		},
		rootConfigPath,
		rootConfiguration,
		resolveFrameworkDependencies: false,
	});
}

/**
 * Normalize provided virtual paths to the original file paths
 */
function transformVirtualPathToFilePath(
	virtualPath: string,
	srcFsBasePath: string, srcVirBasePath: string,
	testFsBasePath?: string, testVirBasePath?: string
): FilePath {
	if (virtualPath.startsWith(srcVirBasePath)) {
		return path.join(srcFsBasePath, posixPath.relative(srcVirBasePath, virtualPath));
	} else if (testFsBasePath && testVirBasePath && virtualPath.startsWith(testVirBasePath)) {
		return path.join(testFsBasePath, posixPath.relative(testVirBasePath, virtualPath));
	} else if (virtualPath.startsWith("/")) {
		return posixPath.relative("/", virtualPath);
	} else {
		throw new Error(
			`Resource path ${virtualPath} is not located within the virtual source or test directories of the project`);
	}
}

async function fsStat(fsPath: string) {
	try {
		return await stat(fsPath);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (err: any) {
		// "File or directory does not exist"
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (err.code === "ENOENT") {
			return false;
		} else {
			throw err;
		}
	}
}

async function dirExists(dirPath: string) {
	const stats = await fsStat(dirPath);
	return stats && stats.isDirectory();
}

async function fileExists(dirPath: string) {
	const stats = await fsStat(dirPath);
	return stats && stats.isFile();
}

function sortLintResults(lintResults: LintResult[]) {
	lintResults.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

function isFileIncluded(file: string, patterns: Minimatch[], patternsMatch: Set<string>) {
	let include = true;

	for (const pattern of patterns) {
		if (pattern.negate && pattern.match(file)) {
			patternsMatch.add(pattern.pattern);
			include = true; // re-include it
		} else if (pattern.match(file)) { // Handle inclusion: exclude if it matches
			patternsMatch.add(pattern.pattern);
			include = false;
		}
	}

	return include;
}

function buildPatterns(patterns: string[]) {
	// Patterns must be only relative (to project's root),
	// otherwise throw an error
	return patterns.map((pattern) => {
		let notNegatedPattern = pattern;
		if (pattern.startsWith("!")) {
			notNegatedPattern = pattern.slice(1);
		}

		if (path.isAbsolute(notNegatedPattern)) {
			throw Error(`Pattern must be relative to project's root folder. ` +
				`"${pattern}" defines an absolute path.`);
		}

		if (pattern.endsWith("/")) { // Match all files in a directory
			pattern += "**/*";
		}

		return new Minimatch(pattern, {flipNegate: true});
	});
}

export function resolveReader({
	patterns,
	resourceReader,
	inverseResult = false,
	patternsMatch,
	relFsBasePath, virBasePath, relFsBasePathTest, virBasePathTest,
}: {
	patterns: string[];
	resourceReader: AbstractReader;
	inverseResult?: boolean;
	patternsMatch: Set<string>;
	relFsBasePath: string; virBasePath: string; relFsBasePathTest?: string; virBasePathTest?: string;
}) {
	if (!patterns.length) {
		return resourceReader;
	}

	const minimatchPatterns = buildPatterns(patterns);

	return createFilterReader({
		reader: resourceReader,
		callback: (resource: Resource) => {
			// Minimatch works with FS and relative paths.
			// So, we need to convert virtual paths to fs
			const resPath = transformVirtualPathToFilePath(
				resource.getPath(), relFsBasePath, virBasePath, relFsBasePathTest, virBasePathTest);

			return inverseResult ?
					// When we work with files paths we actually need to limit the result to those
					// matches, instead of allowing all except XYZ
					!isFileIncluded(resPath, minimatchPatterns, patternsMatch) :
				isFileIncluded(resPath, minimatchPatterns, patternsMatch);
		},
	});
}

/**
 * Checks which patterns were not matched during analysis
 *
 * @param patterns Available patterns
 * @throws Error if an unmatched pattern is found
 */
function checkUnmatchedPatterns(patterns: FilePattern[], patternsMatch: Set<string>) {
	const unmatchedPatterns = patterns.reduce((acc, pattern) => {
		if (pattern.endsWith("/")) { // Match all files in a directory
			pattern += "**/*";
		}
		if (!patternsMatch.has(pattern)) {
			acc.push(pattern);
		}

		return acc;
	}, [] as FilePattern[]);

	if (unmatchedPatterns.length) {
		throw new Error(`Specified file ${unmatchedPatterns.length === 1 ? "pattern" : "patterns"}` +
			` '${unmatchedPatterns.join("', '")}' did not match any resource`);
	}
}
