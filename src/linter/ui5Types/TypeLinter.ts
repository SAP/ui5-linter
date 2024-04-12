import ts from "typescript";
import {FileContents, createVirtualCompilerHost} from "./host.js";
import SourceFileLinter from "./SourceFileLinter.js";
import {taskStart} from "../../util/perf.js";
import {getLogger} from "@ui5/logger";
import LinterContext, {LinterParameters} from "../LinterContext.js";
// import {Project} from "@ui5/project";
import {AbstractAdapter} from "@ui5/fs";
import {createAdapter, createResource} from "@ui5/fs/resourceFactory";

const log = getLogger("linter:ui5Types:TypeLinter");

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

export default class TypeChecker {
	#compilerOptions: ts.CompilerOptions;
	#context: LinterContext;
	#workspace: AbstractAdapter;

	constructor({workspace, context}: LinterParameters) {
		this.#context = context;
		this.#workspace = workspace;
		this.#compilerOptions = {...DEFAULT_OPTIONS};

		const namespace = context.getNamespace();
		if (namespace) {
			// Map namespace used in imports (without /resources) to /resources paths
			this.#compilerOptions.paths = {
				[`${namespace}/*`]: [`/resources/${namespace}/*`],
			};
		}
	}

	async lint() {
		const files: FileContents = new Map();
		const sourceMaps = new Map<string, string>(); // Maps a source path to source map content
		let lazyFileLoading = true;

		const resources = await this.#workspace.byGlob("/**/{*.js,*.js.map,*.ts}");
		let pathsToLint = this.#context.getPathsToLint();
		if (!pathsToLint?.length) {
			lazyFileLoading = false;
			pathsToLint = resources.map((resource) => resource.getPath());
		}
		for (const resource of resources) {
			const resourcePath = resource.getPath();
			if (resourcePath.endsWith(".js.map")) {
				sourceMaps.set(
					// Remove ".map" from path to have it reflect the associated source path
					resource.getPath().slice(0, -4),
					await resource.getString()
				);
			} else {
				if (lazyFileLoading && resource.getSourceMetadata().adapter === "FileSystem" &&
					!resource.getSourceMetadata().contentModified) {
					files.set(resourcePath, () => ts.sys.readFile(resource.getSourceMetadata().fsPath) ?? "");
				} else {
					files.set(resourcePath, await resource.getString());
				}
			}
		}

		const host = await createVirtualCompilerHost(this.#compilerOptions, files, sourceMaps);
		const program = ts.createProgram(pathsToLint, this.#compilerOptions, host);
		const checker = program.getTypeChecker();

		const reportCoverage = this.#context.getReportCoverage();
		const messageDetails = this.#context.getIncludeMessageDetails();
		const typeCheckDone = taskStart("Linting all transpiled resources");
		for (const sourceFile of program.getSourceFiles()) {
			if (!sourceFile.isDeclarationFile && pathsToLint.includes(sourceFile.fileName)) {
				const sourceMap = sourceMaps.get(sourceFile.fileName);
				if (!sourceMap) {
					log.verbose(`Failed to get source map for ${sourceFile.fileName}`);
				}
				const linterDone = taskStart("Type-check resource", sourceFile.fileName, true);
				const linter = new SourceFileLinter(
					this.#context,
					sourceFile.fileName, sourceFile,
					sourceMap,
					checker, reportCoverage, messageDetails
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
		}
	}
}

async function writeTransformedSources(fsBasePath: string,
	originalResourcePath: string,
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
