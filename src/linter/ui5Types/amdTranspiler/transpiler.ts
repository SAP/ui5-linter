import path from "node:path/posix";
import ts from "typescript";
import {getLogger} from "@ui5/logger";
import {taskStart} from "../../../util/perf.js";
import {TranspileResult} from "../../LinterContext.js";
import {createTransformer} from "./tsTransformer.js";
import {UnsupportedModuleError} from "./util.js";
import {AbstractAdapter, Resource} from "@ui5/fs";
import {createResource, createAdapter} from "@ui5/fs/resourceFactory";

const log = getLogger("linter:ui5Types:amdTranspiler:transpiler");

type FilePath = string;
type FileContent = string;
type SourceFiles = Map<FilePath, ts.SourceFile>;
type WrittenFiles = Map<FilePath, FileContent>;

function createCompilerHost(sourceFiles: SourceFiles, writtenFiles: WrittenFiles): ts.CompilerHost {
	return {
		getSourceFile: (fileName) => sourceFiles.get(fileName),
		writeFile: (name, text) => {
			writtenFiles.set(name, text);
		},
		getDefaultLibFileName: () => "lib.d.ts",
		useCaseSensitiveFileNames: () => false,
		getCanonicalFileName: (fileName) => fileName,
		getCurrentDirectory: () => "",
		getNewLine: () => "\n",
		fileExists: (fileName): boolean => sourceFiles.has(fileName),
		readFile: () => "",
		directoryExists: () => true,
		getDirectories: () => [],
	};
}

const compilerOptions = {
	moduleResolution: ts.ModuleResolutionKind.NodeNext,
	checkJs: true,
	allowJs: true,
	skipLibCheck: true,

	target: ts.ScriptTarget.ES2022,
	module: ts.ModuleKind.ES2022,
	isolatedModules: true,
	sourceMap: true,
	suppressOutputPathCheck: true,
	noLib: true,
	noResolve: true,
	allowNonTsExtensions: true,
};

function createProgram(inputFileNames: string[], host: ts.CompilerHost): ts.Program {
	return ts.createProgram(inputFileNames, compilerOptions, host);
}

export function transpileFile(fileName: string, content: string, strict?: boolean): TranspileResult {
	// This is heavily inspired by the TypesScript "transpileModule" API

	const taskDone = taskStart("Transpiling AMD to ESM", fileName, true);
	const sourceFile = ts.createSourceFile(
		fileName,
		content,
		{
			languageVersion: ts.ScriptTarget.ES2022,
			jsDocParsingMode: ts.JSDocParsingMode.ParseNone,
		}
		// /*setParentNodes*/ false,
		// ts.ScriptKind.JS
	);

	const sourceFiles: SourceFiles = new Map();
	sourceFiles.set(fileName, sourceFile);
	const writtenResources: WrittenFiles = new Map();
	const compilerHost = createCompilerHost(sourceFiles, writtenResources);
	const program = createProgram([fileName], compilerHost);

	const transformers: ts.CustomTransformers = {
		before: [createTransformer(program)],
	};

	try {
		// ts.setEmitFlags(sourceFile, ts.EmitFlags.NoTrailingSourceMap);
		// TODO: Investigate whether we can retrieve a source file that can be fed directly into the typeChecker
		program.emit(
			/* targetSourceFile */ undefined, /* writeFile */ undefined,
			/* cancellationToken */ undefined, /* emitOnlyDtsFiles */ undefined,
			transformers);

		/*	tsc currently does not provide an API to emit TypeScript *with* a source map
		 	(see https://github.com/microsoft/TypeScript/issues/51329)

		 	The below can be used to emit TypeScript without a source map:

			const result = ts.transform(
				sourceFile,
				[createTransformer(resourcePath, program)], compilerOptions);

			const printer = ts.createPrinter();
			const printed = printer.printNode(ts.EmitHint.SourceFile, result.transformed[0], sourceFile);
			const printed = printer.printFile(result.transformed[0]);
			outputText = printed;
		*/
	} catch (err) {
		if (strict) {
			throw err;
		}
		if (err instanceof UnsupportedModuleError) {
			log.verbose(`Failed to transform module: ${err.message}`);
			if (err.stack && log.isLevelEnabled("verbose")) {
				log.verbose(`Stack trace:`);
				log.verbose(err.stack);
			}
			return {source: content, map: ""};
		} else if (err instanceof Error && err.message.startsWith("Debug Failure")) {
			// We probably failed to create a valid AST
			log.verbose(`AST transformation failed for module: ${err.message}`);
			if (err.stack && log.isLevelEnabled("verbose")) {
				log.verbose(`Stack trace:`);
				log.verbose(err.stack);
			}
			return {source: content, map: ""};
		}
		throw err;
	}

	const source = writtenResources.get(fileName);
	if (!source) {
		throw new Error(`Transpiling yielded no result for ${fileName}`);
	}
	const map = writtenResources.get(`${fileName}.map`);
	if (!map) {
		throw new Error(`Transpiling yielded no source map for ${fileName}`);
	}

	// Convert sourceMappingURL ending with ".js" to ".ts"
	// map = map
	// 	.replace(`//# sourceMappingURL=${fileName}.map`, `//# sourceMappingURL=${fileName}.map`);
	taskDone();
	return {source, map};
}

export async function transpileWorkspace(workspace: AbstractAdapter, filePaths?: string[], batch = false) {
	let resources: Resource[];
	if (filePaths?.length) {
		resources = (await Promise.all(filePaths.map(async (filePath) => {
			if (!filePath.endsWith(".js")) {
				return;
			}
			const resource = await workspace.byPath(filePath);
			if (!resource) {
				throw new Error(`Resource not found: ${filePath}`);
			}
			return resource;
		}))).filter((r) => r !== undefined) as Resource[];
	} else {
		resources = await workspace.byGlob("**/*.js");
	}
	const taskDone = taskStart(`Transpiling workspace (${resources.length} files) from AMD to ESM`);
	if (batch) {
		await transpileWorkspaceBatch(workspace, resources);
	} else {
		await transpileWorkspaceSerial(workspace, resources);
	}
	taskDone();
}

// Batch drawback: If one transpile fails, all will fail
async function transpileWorkspaceBatch(workspace: AbstractAdapter, resources: Resource[]) {
	const sourceFiles = new Map<string, ts.SourceFile>();
	await Promise.all(resources.map(async (resource) => {
		const content = await resource.getString();
		sourceFiles.set(resource.getPath(), ts.createSourceFile(
			resource.getPath(),
			content,
			{
				languageVersion: ts.ScriptTarget.ES2022,
				jsDocParsingMode: ts.JSDocParsingMode.ParseNone,
			}
		));
	}));

	const writtenResources = new Map<string, string>();
	const compilerHost = createCompilerHost(sourceFiles, writtenResources);
	const program = createProgram(Array.from(sourceFiles.keys()), compilerHost);

	const transformers: ts.CustomTransformers = {
		before: [createTransformer(program)],
	};

	program.emit(
		/* targetSourceFile */ undefined, /* writeFile */ undefined,
		/* cancellationToken */ undefined, /* emitOnlyDtsFiles */ undefined,
		transformers);

	for (const [path, text] of writtenResources.entries()) {
		// if (name.endsWith(".js")) {
		// Convert sourceMappingURL ending with ".js" to ".ts"
		// text = text
		// 	.replace(`//# sourceMappingURL=${sourceMapName}`, `//# sourceMappingURL=${outputFileName}.map`);
		// }
		await workspace.write(createResource({
			path,
			string: text,
		}));
	}
}

async function transpileWorkspaceSerial(workspace: AbstractAdapter, resources: Resource[]) {
	await Promise.all(resources.map(async (resource) => {
		if (resource.getSourceMetadata().fsPath?.endsWith(".xml")) {
			// No transpiling necessary for resources that where originally xml
			// It would also overwrite the existing sourcemap

			if (process.env.UI5LINT_WRITE_TRANSFORMED_SOURCES) {
				await writeTransformedSources(process.env.UI5LINT_WRITE_TRANSFORMED_SOURCES,
					resource.getPath(), await resource.getString(),
					await (await workspace.byPath(resource.getPath() + ".map"))?.getString());
			}
			return;
		}
		const resourcePath = resource.getPath();
		const content = await resource.getString();
		const {source, map} = transpileFile(path.basename(resourcePath), content);
		await workspace.write(createResource({
			path: resourcePath,
			string: source,
		}));
		await workspace.write(createResource({
			path: resourcePath + ".map",
			string: map,
		}));
		if (process.env.UI5LINT_WRITE_TRANSFORMED_SOURCES) {
			await writeTransformedSources(process.env.UI5LINT_WRITE_TRANSFORMED_SOURCES, resourcePath, source, map);
		}
	}));
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
