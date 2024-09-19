import {graphFromObject} from "@ui5/project/graph";
import {createReader, createWorkspace, createReaderCollection, createFilterReader} from "@ui5/fs/resourceFactory";
import {FilePath, LinterOptions, LintResult} from "./LinterContext.js";
import lintWorkspace from "./lintWorkspace.js";
import {taskStart} from "../utils/perf.js";
import path from "node:path";
import posixPath from "node:path/posix";
import {stat} from "node:fs/promises";
import {ProjectGraph} from "@ui5/project";
import type {AbstractReader, Resource} from "@ui5/fs";
import ConfigManager, {UI5LintConfigType} from "../utils/ConfigManager.js";
import {Minimatch} from "minimatch";

async function lint(
	resourceReader: AbstractReader, options: LinterOptions
): Promise<LintResult[]> {
	const lintEnd = taskStart("Linting");
	const {ignorePattern, filePatterns, configPath} = options;

	// Resolve files to include
	let reader = await resolveReader(
		await resolvePatterns(options.rootDir, configPath, filePatterns),
		options.rootDir,
		resourceReader
	);

	// Resolve ignores
	reader = await resolveReader(
		await resolvePatterns(options.rootDir, configPath, ignorePattern),
		options.rootDir,
		reader
	);

	const workspace = createWorkspace({reader});

	const res = await lintWorkspace(workspace, options);
	lintEnd();
	return res;
}

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

	const res = await lint(reader, {
		rootDir,
		namespace: project.getNamespace(),
		filePatterns,
		ignorePattern,
		reportCoverage,
		includeMessageDetails,
		configPath,
		ui5ConfigPath,
	}, config);

	const relFsBasePath = path.relative(rootDir, fsBasePath);
	const relFsBasePathTest = fsBasePathTest ? path.relative(rootDir, fsBasePathTest) : undefined;
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

	const reader = createReader({
		fsBasePath: rootDir,
		virBasePath: namespace ? `/resources/${namespace}/` : "/",
	});

	const res = await lint(reader, {
		rootDir,
		namespace,
		filePatterns,
		ignorePattern,
		reportCoverage,
		includeMessageDetails,
		configPath,
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
	resourceReader: AbstractReader, options: LinterOptions, config: UI5LintConfigType
): Promise<LintResult[]> {
	const lintEnd = taskStart("Linting");
	const {ignorePattern, ui5ConfigPath} = options;

	const ignoresReader = await resolveIgnoresReader(
		ignorePattern,
		options.rootDir,
		resourceReader,
		config,
		ui5ConfigPath
	);

	const workspace = createWorkspace({
		reader: ignoresReader,
	});

	const res = await lintWorkspace(workspace, options, config);
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
 * Resolve provided filePaths to absolute paths and ensure they are located within the project root.
 * Returned paths are absolute.
*/
function resolveFilePaths(rootDir: string, filePaths: string[]): string[] {
	/* rootDir is always absolute, e.g. '/home/user/projects/com.ui5.troublesome.app/'

		filePaths can be absolute, or relative to rootDir:
			Absolute example:
			'/home/user/projects/com.ui5.troublesome.app/webapp/model/formatter.js/webapp/controller/BaseController.js'
			'/home/user/projects/com.ui5.troublesome.app/webapp/model/formatter.js/webapp/model/formatter.js'

			Relative example:
			'webapp/controller/BaseController.js'
			'webapp/model/formatter.js'
	*/
	return filePaths.map((filePath) => {
		if (!path.isAbsolute(filePath)) {
			// Resolve relative filePaths
			filePath = path.join(rootDir, filePath);
		}
		// Ensure file path is located within project root
		if (!filePath.startsWith(rootDir)) {
			throw new Error(
				`File path ${filePath} is not located within project root ${rootDir}`);
		}
		return filePath;
	});
}

function ensurePosix(inputPath: string) {
	if (!inputPath.includes("\\")) {
		return inputPath;
	}
	return inputPath.replace(/\\/g, "/");
}

/**
 * Normalize provided filePaths to virtual paths.
 * Returned paths are absolute, POSIX-style paths
 */
function transformFilePathsToVirtualPaths(
	filePaths: FilePath[],
	srcFsBasePath: string, srcVirBasePath: string,
	testFsBasePath?: string, testVirBasePath?: string
): FilePath[] {
	return filePaths.map((filePath) => {
		if (filePath.startsWith(srcFsBasePath)) {
			return posixPath.join(srcVirBasePath, ensurePosix(path.relative(srcFsBasePath, filePath)));
		} else if (testFsBasePath && testVirBasePath && filePath.startsWith(testFsBasePath)) {
			return posixPath.join(testVirBasePath, ensurePosix(path.relative(testFsBasePath, filePath)));
		} else {
			throw new Error(
				`File path ${filePath} is not located within the detected source or test directories of the project`);
		}
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

/**
 * Function to check if a file path matches the patterns
*/
function isFileIncluded(file: string, patterns: Minimatch[]) {
	let include = true;

	for (const pattern of patterns) {
		if (pattern.negate && pattern.match(file)) {
			include = true; // re-include it
		} else if (pattern.match(file)) { // Handle inclusion: exclude if it matches
			include = false;
		}
	}

	return include;
}

async function resolvePatterns(
	projectRootDir: string,
	configPath?: string,
	patterns?: string[]) {
	const configMngr = new ConfigManager(projectRootDir, configPath);
	const config = await configMngr.getConfiguration();
	patterns = [
		...(config.ignores ?? []),
		...(patterns ?? []), // CLI patterns go after config patterns
	].filter(($) => $);

	// Patterns must be only relative (to project's root),
	// otherwise throw an error
	return patterns.map((pattern) => {
		let notNegatedPattern = pattern;
		if (pattern.startsWith("!")) {
			notNegatedPattern = pattern.slice(1);
		}

		if (path.isAbsolute(notNegatedPattern)) {
			throw Error(`Ignore pattern must be relative to project's root folder. ` +
				`"${pattern}" defines an absolute path.`);
		}

		return new Minimatch(pattern, {flipNegate: true});
	});
}

export async function resolveReader(
	patterns: Minimatch[],
	projectRootDir: string,
	resourceReader: AbstractReader,
	config: UI5LintConfigType,
	ui5ConfigPath?: string) {
	let fsBasePath = "";
	let fsBasePathTest = "";
	let virBasePath = "/resources/";
	let virBasePathTest = "/test-resources/";
	try {
		const graph = await getProjectGraph(projectRootDir, ui5ConfigPath);
		const project = graph.getRoot();
		projectRootDir = project.getRootPath();
		fsBasePath = project.getSourcePath();
		fsBasePathTest = path.join(projectRootDir, project._testPath ?? "test");

		if (!project._isSourceNamespaced) {
			// Ensure the virtual filesystem includes the project namespace to allow relative imports
			// of framework resources from the project
			virBasePath += project.getNamespace() + "/";
			virBasePathTest += project.getNamespace() + "/";
		}
	} catch {
		// Project is not resolved i.e. in tests
	}

	const relFsBasePath = path.relative(projectRootDir, fsBasePath);
	const relFsBasePathTest = fsBasePathTest ? path.relative(projectRootDir, fsBasePathTest) : undefined;

	return !(patterns.length) ?
		resourceReader :
		createFilterReader({
			reader: resourceReader,
			callback: (resource: Resource) => {
				// Minimatch works with FS and relative paths.
				// So, we need to convert virtual paths to fs
				const resPath = transformVirtualPathToFilePath(
					resource.getPath(), relFsBasePath, virBasePath, relFsBasePathTest, virBasePathTest);

				return isFileIncluded(resPath, patterns);
			},
		});
}
