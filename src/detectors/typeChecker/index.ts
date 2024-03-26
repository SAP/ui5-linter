import ts from "typescript";
import path from "node:path";
import fs from "node:fs";
import {createAdapter, createResource} from "@ui5/fs/resourceFactory";
import {createVirtualCompilerHost} from "./host.js";
import FileLinter from "./FileLinter.js";
import Reporter from "../Reporter.js";
import {taskStart} from "../util/perf.js";
import {amdToEsm} from "../transpilers/amd/transpiler.js";
import {xmlToJs} from "../transpilers/xml/transpiler.js";
import {lintManifest} from "../../linter/json/linter.js";
import {lintHtml} from "../../linter/html/linter.js";
import {
	FileBasedDetector, LintMessage, LintMessageSeverity, LintResult, ProjectBasedDetector,
} from "../AbstractDetector.js";
import {Project} from "@ui5/project";
import {Resource} from "@ui5/fs";

const DEFAULT_OPTIONS: ts.CompilerOptions = {
	target: ts.ScriptTarget.ES2022,
	module: ts.ModuleKind.ES2022,
	moduleResolution: ts.ModuleResolutionKind.NodeNext,
	// Skip lib check to speed up linting. Libs should generally be fine,
	// we might want to add a unit test doing the check during development
	skipLibCheck: true,
	// Include standard typescript libraries for ES2022 and DOM support
	lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
	// Allow and check JavaScript files since this is everything we'll do here
	allowJs: true,
	checkJs: true,
	strict: true,
	noImplicitAny: false,
	strictNullChecks: false,
	strictPropertyInitialization: false,
	rootDir: "/",
	// Library modules (e.g. sap/ui/core/library.js) do not have a default export but
	// instead have named exports e.g. for enums defined in the module.
	// However, in current JavaScript code (UI5 AMD) the whole object is exported, as there are no
	// named exports outside of ES Modules / TypeScript.
	// This property compensates this gap and tries to all usage of default imports where actually
	// no default export is defined.
	// NOTE: This setting should not be used when analyzing TypeScript code, as it would allow
	// using an default import on library modules, which is not intended.
	// A better solution:
	// During transpilation, for every library module (where no default export exists),
	// an "import * as ABC" instead of a default import is created.
	// This logic needs to be in sync with the generator for UI5 TypeScript definitions.
	allowSyntheticDefaultImports: true,
};

export class TsProjectDetector extends ProjectBasedDetector {
	compilerOptions: ts.CompilerOptions;
	#projectBasePath: string;

	constructor(project: Project) {
		super(project);
		this.compilerOptions = {...DEFAULT_OPTIONS};

		const namespace = project.getNamespace();
		this.#projectBasePath = `/resources/${namespace}/`;
		this.compilerOptions.paths = {
			[`${namespace}/*`]: [`${this.#projectBasePath}*`],
		};
	}

	private async writeTransformedSources(fsBasePath: string, originalResourcePath: string,
		source: string, map: string | undefined) {
		const transformedWriter = createAdapter({
			fsBasePath,
			virBasePath: "/",
		});

		await transformedWriter.write(
			createResource({
				path: originalResourcePath + ".ui5lint.transformed.js",
				string: source,
			})
		);

		if (map) {
			await transformedWriter.write(
				createResource({
					path: originalResourcePath + ".ui5lint.transformed.js.map",
					string: JSON.stringify(JSON.parse(map), null, "\t"),
				})
			);
		}
	}

	private getModuleId(resourcePath: string) {
		let resourcePathHeader = "/resources/";
		if (resourcePath.startsWith("/test-resources/")) {
			resourcePathHeader = "/test-resources/";
		}
		return resourcePath.substring(resourcePathHeader.length);
	}

	private async analyzeFiles(all: Resource[], resources: Map<string, string>, sourceMaps: Map<string, string>,
		resourceMessages: Map<string, LintMessage[]>, vfsToFsPaths: Map<string, string>, result: LintResult[]) {
		return Promise.all(all.map(async (resource: Resource) => {
			const originalResourcePath = resource.getPath();
			const fsPath = resource.getSourceMetadata().fsPath;

			let source: string, map: string | undefined, messages: LintMessage[] | undefined;
			let resourcePath = originalResourcePath;
			try {
				if (resourcePath.endsWith(".xml")) {
					resourcePath = resourcePath.replace(/\.xml$/, ".js");
					const resourceContent = resource.getStream();
					({source, map, messages} =
						await xmlToJs(path.basename(originalResourcePath), resourceContent));
				} else if (resourcePath.endsWith(".js")) {
					const resourceContent = await resource.getString();
					const id = this.getModuleId(resourcePath);
					({source, map} = amdToEsm(id, resourceContent));
				} else if (resourcePath.endsWith(".json")) {
					resourcePath = resourcePath.replace(/\.json$/, ".js");
					const resourceContent = await resource.getString();
					({source, messages} = await lintManifest(resourcePath, resourceContent));
				} else if (resourcePath.endsWith(".html")) {
					resourcePath = resourcePath.replace(/\.html$/, ".js");
					source = await resource.getString();
					({messages} = await lintHtml(resourcePath, resource.getStream()));
				} else {
					throw new Error(`Unsupported file type for ${resourcePath}`);
				}
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				const errorLinterReporter = new Reporter(this.project.getRootPath(), fsPath);
				errorLinterReporter.addMessage({
					severity: LintMessageSeverity.Error,
					message,
					ruleId: "ui5-linter-parsing-error",
					fatal: true,
				});
				result.push(errorLinterReporter.getReport());
				return;
			}
			vfsToFsPaths.set(resourcePath, fsPath);

			resources.set(resourcePath, source);
			if (messages?.length) {
				resourceMessages.set(resourcePath, messages);
			}
			if (map) {
				sourceMaps.set(resourcePath, map);
			}
			if (process.env.UI5LINT_WRITE_TRANSFORMED_SOURCES) {
				await this.writeTransformedSources(process.env.UI5LINT_WRITE_TRANSFORMED_SOURCES,
					originalResourcePath, source, map);
			}
		}));
	}

	async createReports(
		filePaths: string[],
		reportCoverage: boolean | undefined = false,
		messageDetails: boolean | undefined = false
	) {
		const result: LintResult[] = [];
		const reader = this.project.getReader({
			style: "buildtime",
		});

		// Read all resources and test-resources and their content since tsc works completely synchronous
		const globEnd = taskStart("Locating Resources");
		const fileTypes = "{*.js,*.view.xml,*.fragment.xml,manifest.json,*.html}";
		const allResources = await reader.byGlob("/resources/**/" + fileTypes);
		const allTestResources = await reader.byGlob("/test-resources/**/" + fileTypes);
		globEnd();
		const resources = new Map<string, string>();
		const sourceMaps = new Map<string, string>();
		const resourceMessages = new Map<string, LintMessage[]>();
		const vfsToFsPaths = new Map<string, string>();

		const transpileTaskEnd = taskStart("Transpiling Resources", `${allResources.length} Resources`);
		await this.analyzeFiles(allResources, resources, sourceMaps, resourceMessages, vfsToFsPaths, result);
		transpileTaskEnd();

		const transpileTestResourcesTaskEnd = taskStart("Transpiling Test-Resources",
			`${allTestResources.length} Resources`);
		await this.analyzeFiles(allTestResources, resources, sourceMaps, resourceMessages, vfsToFsPaths, result);
		transpileTestResourcesTaskEnd();

		/*	Handle filePaths parameter:

			Project path will always be absolute. e.g. '/home/user/projects/com.ui5.troublesome.app/'

			filePaths (if provided) can either be absolute or relative

			Absolute example:
			'/home/user/projects/com.ui5.troublesome.app/webapp/model/formatter.js/webapp/controller/BaseController.js'
			'/home/user/projects/com.ui5.troublesome.app/webapp/model/formatter.js/webapp/model/formatter.js'

			Check: Absolute paths must be located within projectPath

			Relative example:
			'webapp/controller/BaseController.js'
			'webapp/model/formatter.js'

			Task: Always resolve relative paths to the projectPath
				(and check the resulting path is within the projectPath)
		*/
		let resourcePaths: (string | undefined)[];
		if (filePaths?.length) {
			const absoluteFilePaths = filePaths.map((filePath) => {
				if (!path.isAbsolute(filePath)) {
					// Resolve relative filePaths
					filePath = path.join(this.project.getRootPath(), filePath);
				}
				// Ensure file path is located within project root
				if (!filePath.startsWith(this.project.getRootPath())) {
					throw new Error(
						`File ${filePath} is not located within project root ${this.project.getRootPath()}`);
				}
				return filePath;
			});

			// Rewrite fs-paths to virtual paths
			resourcePaths = [...allResources, ...allTestResources].map((res: Resource) => {
				if (absoluteFilePaths.includes(res.getSourceMetadata().fsPath)) {
					return res.getPath();
				}
			})
				.filter(($: string | undefined) => $)
				.map((res) => {
					if (res && !res.endsWith(".js")) {
						const chunks = res?.split(".");
						chunks.splice(-1, 1, "js");
						res = chunks.join(".");
					}
					return res;
				});
		} else {
			resourcePaths = Array.from(resources.keys());
		}
		resourcePaths.sort();

		const host = await createVirtualCompilerHost(this.compilerOptions, resources);
		const program = ts.createProgram(resourcePaths as string[], this.compilerOptions, host);
		const checker = program.getTypeChecker();

		const typeCheckDone = taskStart("Linting all transpiled resources");
		for (const sourceFile of program.getSourceFiles()) {
			if (!sourceFile.isDeclarationFile && resourcePaths.includes(sourceFile.fileName)) {
				const filePath = vfsToFsPaths.get(sourceFile.fileName);
				if (!filePath) {
					throw new Error(`Failed to get FS path for ${sourceFile.fileName}`);
				}
				const linterDone = taskStart("Lint resource", filePath, true);
				const linter = new FileLinter(
					this.project.getRootPath(),
					filePath, sourceFile, sourceMaps.get(sourceFile.fileName), checker, reportCoverage, messageDetails
				);
				const report = await linter.getReport();
				if (resourceMessages.has(sourceFile.fileName)) {
					report.messages.push(...resourceMessages.get(sourceFile.fileName)!);
					report.errorCount = report.messages
						.filter((message) => message.severity === LintMessageSeverity.Error).length;
					report.warningCount = report.messages
						.filter((message) => message.severity === LintMessageSeverity.Warning).length;
					report.fatalErrorCount = report.messages.filter((message) => message.fatal).length;
				}
				result.push(report);
				linterDone();
			}
		}
		typeCheckDone();
		return result;
	}
}

export class TsFileDetector extends FileBasedDetector {
	async createReports(
		filePaths: string[], reportCoverage: boolean | undefined = false, messageDetails: boolean | undefined = false
	) {
		const options: ts.CompilerOptions = {
			...DEFAULT_OPTIONS,
			rootDir: this.rootDir,
		};

		const resources = new Map<string, string>();
		const sourceMaps = new Map<string, string>();
		const resourceMessages = new Map<string, LintMessage[]>();
		const internalToFsFilePaths = new Map<string, string>();
		const internalfilePaths = await Promise.all(filePaths.map(async (filePath: string) => {
			let transformationResult;
			filePath = path.join(this.rootDir, filePath);
			let internalfilePath = filePath.replace(/\\/g, "/");
			if (filePath.endsWith(".js")) {
				const fileContent = ts.sys.readFile(filePath);
				if (!fileContent) {
					throw new Error(`Failed to read file ${filePath}`);
				}
				transformationResult = amdToEsm(path.basename(filePath, ".js"), fileContent);
			} else if (filePath.endsWith(".xml")) {
				const fileStream = fs.createReadStream(filePath);
				internalfilePath = internalfilePath.replace(/\.xml$/, ".js");
				transformationResult = await xmlToJs(path.basename(filePath), fileStream);
			} else if (filePath.endsWith(".json")) {
				const fileContent = ts.sys.readFile(filePath);
				if (!fileContent) {
					throw new Error(`Failed to read file ${filePath}`);
				}
				internalfilePath = internalfilePath.replace(/\.json$/, ".js");
				transformationResult = await lintManifest(filePath.replace(/\.json$/, ".js"), fileContent);
			} else if (filePath.endsWith(".html")) {
				const fileContent = ts.sys.readFile(filePath);
				if (!fileContent) {
					throw new Error(`Failed to read file ${filePath}`);
				}
				internalfilePath = filePath.replace(/\.html$/, ".js");
				transformationResult = await lintHtml(internalfilePath, fs.createReadStream(filePath));
				transformationResult.source = fileContent;
			} else {
				throw new Error(`Unsupported file type for ${filePath}`);
			}
			const {source, map} = transformationResult;
			resources.set(internalfilePath, source);
			if (map) {
				sourceMaps.set(internalfilePath, map);
			}
			if (transformationResult.messages?.length) {
				resourceMessages.set(internalfilePath, transformationResult.messages);
			}

			internalToFsFilePaths.set(internalfilePath, filePath);
			return internalfilePath;
		}));

		const host = await createVirtualCompilerHost(options, resources);
		const program = ts.createProgram(internalfilePaths, options, host);
		const checker = program.getTypeChecker();

		const result: LintResult[] = [];

		for (const sourceFile of program.getSourceFiles()) {
			if (!sourceFile.isDeclarationFile) {
				const filePath = internalToFsFilePaths.get(sourceFile.fileName);
				if (!filePath) {
					throw new Error(`Failed to get FS path for ${sourceFile.fileName}`);
				}
				const linter = new FileLinter(
					this.rootDir, filePath, sourceFile,
					sourceMaps.get(sourceFile.fileName), checker, reportCoverage, messageDetails
				);
				const report = await linter.getReport();
				if (resourceMessages.has(sourceFile.fileName)) {
					report.messages.push(...resourceMessages.get(sourceFile.fileName)!);
					report.errorCount = report.messages
						.filter((message) => message.severity === LintMessageSeverity.Error).length;
					report.warningCount = report.messages
						.filter((message) => message.severity === LintMessageSeverity.Warning).length;
					report.fatalErrorCount = report.messages.filter((message) => message.fatal).length;
				}
				result.push(report);
			}
		}
		return result;
	}
}
