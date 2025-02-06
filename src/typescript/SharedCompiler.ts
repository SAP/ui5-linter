import ts from "typescript";
import LanguageServiceHost from "./LanguageServiceHost.js";
import LinterContext from "../linter/LinterContext.js";
import {FileContents} from "../linter/ui5Types/host.js";

/*
function create() {
	const languageServiceHost = new LanguageServiceHost({
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
	});

	languageServiceHost.addFile("foo.ts", `export default function foo() { return 123; }`);
	languageServiceHost.addFile("main.ts", `
		import foo from "./foo.js";
		const message = foo();`);

	// TODO: Use pre-filled documentRegistry from disk cache to improve performance even more
	const languageService = ts.createLanguageService(languageServiceHost, ts.createDocumentRegistry());

	function printVarType(sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
		const variableDeclaration = sourceFile.statements[1].declarationList.declarations[0];
		const varType = checker.getTypeAtLocation(variableDeclaration);
		console.log(`string: ` + (varType.flags & ts.TypeFlags.String));
		console.log(`number: ` + (varType.flags & ts.TypeFlags.Number));
	}

	const program = languageService.getProgram();
	if (program) {
		for (const sourceFile of program.getSourceFiles()) {
			if (!sourceFile.isDeclarationFile) {
				console.log(sourceFile.fileName);
				if (sourceFile.fileName === "main.ts") {
					printVarType(sourceFile, program.getTypeChecker());
				}
			}
		}
		console.log("-----");
	}

	languageServiceHost.removeFile("foo.ts");
	languageServiceHost.addFile("foo.ts", `export default function foo() { return "abc"; }`);

	// const languageService2 = ts.createLanguageService(languageServiceHost);
	// const program2 = languageService2.getProgram();
	const program2 = languageService.getProgram();

	if (program2) {
		for (const sourceFile of program2.getSourceFiles()) {
			if (!sourceFile.isDeclarationFile) {
				console.log(sourceFile.fileName);
				if (sourceFile.fileName === "main.ts") {
					printVarType(sourceFile, program2.getTypeChecker());
				}
			}
		}
		console.log("-----");
	}
}

// TEST:
create();
*/

interface AcquireOptions {
	compilerOptionsOverride: ts.CompilerOptions;
	files: FileContents;
	sourceMaps: Map<string, string>;
	context: LinterContext;
}

export default class SharedCompiler {
	private readonly languageServiceHost: LanguageServiceHost;
	private readonly languageService: ts.LanguageService;
	private acquired = false;

	constructor(compilerOptions: ts.CompilerOptions) {
		this.languageServiceHost = new LanguageServiceHost(compilerOptions);
		this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
	}

	acquire(acquireOptions: AcquireOptions) {
		if (this.acquired) {
			throw new Error("SharedCompiler is already acquired");
		}
		this.acquired = true;

		this.languageServiceHost.setProjectInfo(
			acquireOptions.files, acquireOptions.sourceMaps, acquireOptions.context
		);

		const program = this.languageService.getProgram();
		if (!program) {
			throw new Error("SharedCompiler failed to create a program");
		}
		return program;
	}

	release() {
		if (!this.acquired) {
			throw new Error("SharedCompiler is not acquired");
		}
		this.acquired = false;
	}
}
