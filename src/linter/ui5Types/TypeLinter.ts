import ts from "typescript";
import {FileContents, createVirtualCompilerHost} from "./host.js";
import SourceFileLinter from "./SourceFileLinter.js";
import {taskStart} from "../../utils/perf.js";
import {getLogger} from "@ui5/logger";
import LinterContext, {LinterParameters} from "../LinterContext.js";
import path from "node:path/posix";
import {AbstractAdapter} from "@ui5/fs";
import {createAdapter, createResource} from "@ui5/fs/resourceFactory";
import {loadApiExtract} from "../../utils/ApiExtract.js";
import {CONTROLLER_BY_ID_DTS_PATH} from "../xmlTemplate/linter.js";

const log = getLogger("linter:ui5Types:TypeLinter");

const DEFAULT_OPTIONS: ts.CompilerOptions = {
	target: ts.ScriptTarget.ES2022,
	module: ts.ModuleKind.ES2022,
	// Skip lib check to speed up linting. Libs should generally be fine,
	// we might want to add a unit test doing the check during development
	skipLibCheck: true,
	// Include standard typescript libraries for ES2022 and DOM support
	lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
	// Allow and check JavaScript files since this is everything we'll do here
	allowJs: true,
	checkJs: false,
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

export default class TypeChecker {
	#compilerOptions: ts.CompilerOptions;
	#context: LinterContext;
	#workspace: AbstractAdapter;
	#filePathsWorkspace: AbstractAdapter;

	constructor({workspace, filePathsWorkspace, context}: LinterParameters) {
		this.#context = context;
		this.#workspace = workspace;
		this.#filePathsWorkspace = filePathsWorkspace;
		this.#compilerOptions = {...DEFAULT_OPTIONS};

		const namespace = context.getNamespace();
		if (namespace) {
			// Map namespace used in imports (without /resources) to /resources paths
			this.#compilerOptions.paths = {
				[`${namespace}/*`]: [
					// Enforce that the compiler also tries to resolve imports with a .js extension.
					// With this mapping, the compiler still first tries to resolve the .ts, .tsx and .d.ts extensions
					// but then falls back to .js
					`/resources/${namespace}/*.js`,
				],
			};
		}
	}

	async lint() {
		const silly = log.isLevelEnabled("silly");
		const files: FileContents = new Map();
		const sourceMaps = new Map<string, string>(); // Maps a source path to source map content

		const allResources = await this.#workspace.byGlob("/**/{*.js,*.js.map,*.ts}");
		const filteredResources = await this.#filePathsWorkspace.byGlob("/**/{*.js,*.js.map,*.ts}");
		const pathsToLint = filteredResources.map((resource) => resource.getPath());

		// Sort paths to ensure consistent order (helps with debugging and comparing verbose/silly logs)
		pathsToLint.sort((a, b) => a.localeCompare(b));

		if (silly) {
			log.silly(`pathsToLint: ${pathsToLint.join(", ")}`);
		}

		for (const resource of allResources) {
			const resourcePath = resource.getPath();
			if (resourcePath.endsWith(".js.map")) {
				sourceMaps.set(
					// Remove ".map" from path to have it reflect the associated source path
					resource.getPath().slice(0, -4),
					await resource.getString()
				);
			} else {
				files.set(resourcePath, await resource.getString());
			}
		}

		const host = await createVirtualCompilerHost(this.#compilerOptions, files, sourceMaps, this.#context);

		const createProgramDone = taskStart("ts.createProgram", undefined, true);
		const program = ts.createProgram(
			allResources.map((resource) => resource.getPath()), this.#compilerOptions, host);
		createProgramDone();

		const getTypeCheckerDone = taskStart("program.getTypeChecker", undefined, true);
		const checker = program.getTypeChecker();
		getTypeCheckerDone();

		const apiExtract = await loadApiExtract();

		const reportCoverage = this.#context.getReportCoverage();
		const messageDetails = this.#context.getIncludeMessageDetails();
		const typeCheckDone = taskStart("Linting all transpiled resources");
		for (const sourceFile of program.getSourceFiles()) {
			if (!sourceFile.isDeclarationFile && pathsToLint.includes(sourceFile.fileName)) {
				const sourceMap = sourceMaps.get(sourceFile.fileName);
				if (!sourceMap) {
					log.verbose(`Failed to get source map for ${sourceFile.fileName}`);
				}
				let manifestContent;
				if (sourceFile.fileName.endsWith("/Component.js") || sourceFile.fileName.endsWith("/Component.ts")) {
					const res = await this.#workspace.byPath(path.dirname(sourceFile.fileName) + "/manifest.json");
					if (res) {
						manifestContent = await res.getString();
					}
				}
				if (silly) {
					log.silly(`Linting ${sourceFile.fileName}`);
				}
				const linterDone = taskStart("Type-check resource", sourceFile.fileName, true);
				const linter = new SourceFileLinter(
					this.#context, sourceFile.fileName,
					sourceFile, sourceMaps,
					checker, reportCoverage, messageDetails,
					apiExtract, manifestContent
				);
				await linter.lint();
				linterDone();
			}
		}
		typeCheckDone();

		if (process.env.UI5LINT_WRITE_TRANSFORMED_SOURCES) {
			// If requested, write out every resource that has a source map (which indicates it has been transformed)
			// Loop over sourceMaps set
			for (const [resourcePath, sourceMap] of sourceMaps) {
				let fileContent = files.get(resourcePath);

				if (typeof fileContent === "function") {
					fileContent = fileContent();
				}
				if (fileContent) {
					await writeTransformedSources(process.env.UI5LINT_WRITE_TRANSFORMED_SOURCES,
						resourcePath, fileContent, sourceMap);
				}
			}
			// Although not being a typical transformed source, write out the byId dts file for debugging purposes
			let byIdDts = files.get(CONTROLLER_BY_ID_DTS_PATH);
			if (byIdDts) {
				if (typeof byIdDts === "function") {
					byIdDts = byIdDts();
				}
				await writeTransformedSources(process.env.UI5LINT_WRITE_TRANSFORMED_SOURCES,
					CONTROLLER_BY_ID_DTS_PATH, byIdDts);
			}
		}
	}
}

async function writeTransformedSources(fsBasePath: string,
	originalResourcePath: string,
	source: string, map?: string) {
	const transformedWriter = createAdapter({
		fsBasePath,
		virBasePath: "/",
	});

	await transformedWriter.write(
		createResource({
			path: originalResourcePath,
			string: source,
		})
	);

	if (map) {
		await transformedWriter.write(
			createResource({
				path: originalResourcePath + ".map",
				string: JSON.stringify(JSON.parse(map), null, "\t"),
			})
		);
	}
}
