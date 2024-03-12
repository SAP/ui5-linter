import ts from "typescript";
import {getLogger} from "@ui5/logger";
import path from "node:path/posix";
import {taskStart} from "../../util/perf.js";
import {TranspileResult} from "../AbstractTranspiler.js";
import {createTransformer} from "./TsTransformer.js";
import {UnsupportedModuleError} from "./util.js";

const log = getLogger("transpilers:amd:transpiler");

export function amdToEsm(moduleId: string, content: string, strict?: boolean): TranspileResult {
	try {
		const taskEnd = taskStart("Transform JS", moduleId, true);
		const esmContent = transpile(moduleId, content, strict);
		taskEnd();
		if (!esmContent.source) {
			log.verbose(`ESM transpiler returned no result for ${moduleId}`);
			return {source: content, map: ""};
		}
		return esmContent;
	} catch (err) {
		if (err instanceof Error) {
			throw new Error(`Failed to transpile module ${moduleId}: ${err.message}`, {
				cause: err,
			});
		} else {
			throw err;
		}
	}
}

function transpile(resourcePath: string, content: string, strict?: boolean): TranspileResult {
	// This is heavily inspired by the TypesScript "transpileModule" API,
	// which sadly does not expose the program instance, which we need to access the type checker
	const moduleName = path.basename(resourcePath, ".js");
	const inputFileName = `${moduleName}.js`;
	const outputFileName = `${moduleName}.ts`;
	const sourceFile = ts.createSourceFile(
		inputFileName,
		content,
		{
			languageVersion: ts.ScriptTarget.ES2022,
			jsDocParsingMode: ts.JSDocParsingMode.ParseNone,
		}
	);

	// Output
	let outputText: string | undefined;
	let sourceMapText: string | undefined;
	let sourceMapName: string | undefined;

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

	// TODO: Investigate whether it would be faster to create one host + program to transpile many files in
	// one batch
	const compilerHost: ts.CompilerHost = {
		getSourceFile: (fileName) => fileName === inputFileName ? sourceFile : undefined,
		writeFile: (name, text) => {
			if (name.endsWith(".map")) {
				if (sourceMapText) {
					throw new Error(`Unexpected multiple source maps for module ${resourcePath}`);
				}
				sourceMapText = text;
				sourceMapName = name;
			} else {
				if (outputText) {
					throw new Error(`Unexpected multiple outputs for module ${resourcePath}`);
				}
				outputText = text;
			}
		},
		getDefaultLibFileName: () => "lib.d.ts",
		useCaseSensitiveFileNames: () => false,
		getCanonicalFileName: (fileName) => fileName,
		getCurrentDirectory: () => "",
		getNewLine: () => "\n",
		fileExists: (fileName): boolean => fileName === inputFileName,
		readFile: () => "",
		directoryExists: () => true,
		getDirectories: () => [],
	};
	const program = ts.createProgram([inputFileName], compilerOptions, compilerHost);

	const transformers: ts.CustomTransformers = {
		before: [createTransformer(resourcePath, program)],
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
			log.verbose(`Failed to transform module ${resourcePath}: ${err.message}`);
			if (err.stack && log.isLevelEnabled("verbose")) {
				log.verbose(`Stack trace:`);
				log.verbose(err.stack);
			}
			return {source: content, map: ""};
		} else if (err instanceof Error && err.message.startsWith("Debug Failure")) {
			// We probably failed to create a valid AST
			log.verbose(`AST transformation failed for module ${resourcePath}: ${err.message}`);
			if (err.stack && log.isLevelEnabled("verbose")) {
				log.verbose(`Stack trace:`);
				log.verbose(err.stack);
			}
			return {source: content, map: ""};
		}
		throw err;
	}

	if (outputText === undefined) throw new Error(`Transpiling yielded no result for ${resourcePath}`);

	// Convert sourceMappingURL ending with ".js" to ".ts"
	outputText = outputText
		.replace(`//# sourceMappingURL=${sourceMapName}`, `//# sourceMappingURL=${outputFileName}.map`);
	return {source: outputText, map: sourceMapText!};
}
