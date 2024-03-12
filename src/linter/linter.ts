import {graphFromObject} from "@ui5/project/graph";
import {LintResult} from "../detectors/AbstractDetector.js";
import {TsFileDetector, TsProjectDetector} from "../detectors/typeChecker/index.js";
import {taskStart} from "../detectors/util/perf.js";
import path from "node:path";
import {stat} from "node:fs/promises";
import {ProjectGraph} from "@ui5/project";

interface LinterOptions {
	rootDir: string;
	filePaths: string[];
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

async function getProjectGraph(rootDir: string): Promise<ProjectGraph> {
	let rootConfigPath, rootConfiguration;
	const ui5YamlPath = path.join(rootDir, "ui5.yaml");
	if (await fileExists(ui5YamlPath)) {
		rootConfigPath = ui5YamlPath;
	} else {
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

export async function lintProject({rootDir, filePaths}: LinterOptions): Promise<LintResult[]> {
	const lintEnd = taskStart("Linting Project");
	const projectGraphDone = taskStart("Project Graph creation");
	const graph = await getProjectGraph(rootDir);
	const project = graph.getRoot();
	projectGraphDone();
	const tsDetector = new TsProjectDetector(project);
	const res = await tsDetector.createReports(filePaths);
	lintEnd();
	return res;
}

export async function lintFile({rootDir, filePaths}: LinterOptions): Promise<LintResult[]> {
	const tsDetector = new TsFileDetector(rootDir);
	return await tsDetector.createReports(filePaths);
}
