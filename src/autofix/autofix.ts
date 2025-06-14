import ts from "typescript";
import MagicString from "magic-string";
import {getLogger} from "@ui5/logger";
import {Resource} from "@ui5/fs";
import LinterContext, {RawLintMessage, ResourcePath} from "../linter/LinterContext.js";
import {MESSAGE} from "../linter/messages.js";
import {ModuleDeclaration} from "../linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";
import {RequireExpression} from "../linter/ui5Types/amdTranspiler/parseRequire.js";
import generateChanges from "./generateChanges.js";

const log = getLogger("linter:autofix");

export interface AutofixResource {
	resource: Resource;
	messages: RawLintMessage[];
}

export interface AutofixOptions {
	rootDir: string;
	namespace?: string;
	resources: Map<ResourcePath, AutofixResource>;
	context: LinterContext;
}

export enum ChangeAction {
	INSERT = "insert",
	REPLACE = "replace",
	DELETE = "delete",
}

export type ChangeSet = InsertChange | ReplaceChange | DeleteChange;

interface AbstractChangeSet {
	action: ChangeAction;
	start: number;
}

export interface InsertChange extends AbstractChangeSet {
	action: ChangeAction.INSERT;
	value: string;
}

export interface ReplaceChange extends AbstractChangeSet {
	action: ChangeAction.REPLACE;
	end: number;
	value: string;
}

export interface DeleteChange extends AbstractChangeSet {
	action: ChangeAction.DELETE;
	end: number;
}

export type AutofixResult = Map<ResourcePath, string>;
type SourceFiles = Map<ResourcePath, ts.SourceFile>;

export interface Position {
	line: number;
	column: number;
	pos: number;
}

export interface DeprecatedApiAccessNode {
	apiName: string;
	position: Position;
	node?: ts.CallExpression | ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
}

export type ImportRequests = Map<string, {
	nodeInfos?: DeprecatedApiAccessNode[];
	identifier: string;
}>;

export type ModuleDeclarationInfo = ExistingModuleDeclarationInfo;

export interface ExistingModuleDeclarationInfo {
	moduleDeclaration: ModuleDeclaration | RequireExpression;
	importRequests: ImportRequests;
}

function createCompilerHost(sourceFiles: SourceFiles): ts.CompilerHost {
	return {
		getSourceFile: (fileName) => sourceFiles.get(fileName),
		writeFile: () => undefined,
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

const compilerOptions: ts.CompilerOptions = {
	checkJs: false,
	allowJs: true,
	skipLibCheck: true,
	noCheck: true,
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

function createSourceFile(resourcePath: string, code: string) {
	return ts.createSourceFile(
		resourcePath,
		code,
		{
			languageVersion: ts.ScriptTarget.ES2022,
			jsDocParsingMode: ts.JSDocParsingMode.ParseNone,
		}
	);
}

function getJsErrorsForSourceFile(sourceFile: ts.SourceFile, program: ts.Program, host: ts.CompilerHost) {
	const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);
	return diagnostics.filter(function (d) {
		return d.file === sourceFile && d.category === ts.DiagnosticCategory.Error;
	}).map((d) => {
		let codeSnippet;
		let pos;
		if (d.start !== undefined && d.length !== undefined) {
			codeSnippet = sourceFile.text.substring(d.start, d.start + d.length);
			pos = ts.getLineAndCharacterOfPosition(sourceFile, d.start);
		}
		return {
			messageText: ts.flattenDiagnosticMessageText(d.messageText, host.getNewLine()),
			start: d.start,
			length: d.length,
			line: pos?.line,
			character: pos?.character,
			file: d.file,
			codeSnippet,
		};
	});
}

function getJsErrors(code: string, resourcePath: string) {
	const sourceFile = createSourceFile(resourcePath, code);
	const host = createCompilerHost(new Map([[resourcePath, sourceFile]]));
	const program = createProgram([resourcePath], host);
	return getJsErrorsForSourceFile(sourceFile, program, host);
}

export function getFactoryPosition(moduleDeclaration: ExistingModuleDeclarationInfo): {start: number; end: number} {
	const {moduleDeclaration: declaration} = moduleDeclaration;
	const factory = "factory" in declaration ? declaration.factory : declaration.callback;
	if (!factory) {
		throw new Error("Module declaration does not have a factory or callback defined");
	}
	return {
		start: factory.getStart(),
		end: factory.getEnd(),
	};
}

export default async function ({
	rootDir: _unused1,
	namespace: _unused2,
	resources: autofixResources,
	context,
}: AutofixOptions): Promise<AutofixResult> {
	const messages = new Map<string, RawLintMessage[]>();
	const resources: Resource[] = [];
	for (const [_, autofixResource] of autofixResources) {
		messages.set(autofixResource.resource.getPath(), autofixResource.messages);
		resources.push(autofixResource.resource);
	}

	const sourceFiles: SourceFiles = new Map();
	const resourcePaths = [];
	for (const resource of resources) {
		const resourcePath = resource.getPath();
		const sourceFile = ts.createSourceFile(
			resource.getPath(),
			await resource.getString(),
			{
				languageVersion: ts.ScriptTarget.ES2022,
				jsDocParsingMode: ts.JSDocParsingMode.ParseNone,
			}
		);
		sourceFiles.set(resourcePath, sourceFile);
		resourcePaths.push(resourcePath);
	}

	const compilerHost = createCompilerHost(sourceFiles);
	const program = createProgram(resourcePaths, compilerHost);

	const checker = program.getTypeChecker();
	const res: AutofixResult = new Map();
	for (const [resourcePath, sourceFile] of sourceFiles) {
		// Checking for syntax errors in the original source file.
		// We should not apply autofixes to files with syntax errors
		const existingJsErrors = getJsErrorsForSourceFile(sourceFile, program, compilerHost);
		if (existingJsErrors.length) {
			log.verbose(`Skipping autofix for '${resourcePath}'. Syntax error(s) in original source file:\n - ` +
				`${existingJsErrors.map((d) => {
					let res = d.messageText;
					if (d.codeSnippet) {
						res += ` (\`${d.codeSnippet}\`)`;
					}
					return res;
				}).join("\n - ")}`);
			continue;
		}

		log.verbose(`Applying autofix for ${resourcePath}`);
		let newContent;
		try {
			newContent = applyFixes(checker, sourceFile, resourcePath, messages.get(resourcePath)!);
		} catch (err) {
			if (err instanceof Error) {
				log.verbose(`Error while applying autofix to ${resourcePath}: ${err}`);
				if (err instanceof Error) {
					log.verbose(`Call stack: ${err.stack}`);
				}
				context.addLintingMessage(resourcePath, MESSAGE.AUTOFIX_ERROR, {message: err.message});
				continue;
			}
			throw err;
		}
		if (newContent) {
			const jsErrors = getJsErrors(newContent, resourcePath);
			if (jsErrors.length) {
				const contentWithMarkers = newContent.split("\n");
				const message = `Syntax error after applying autofix for '${resourcePath}':\n - ` +
					jsErrors
						.sort((a, b) => {
							if (a.start === undefined || b.start === undefined) {
								return 0;
							}
							return a.start - b.start;
						}).map((d) => {
							if (d.line !== undefined && d.character !== undefined) {
								// Insert line below the finding and mark the character
								const line = d.line + 1;
								contentWithMarkers.splice(line, 0, " ".repeat(d.character) + "^");
							}
							let res = d.messageText;
							if (d.codeSnippet) {
								res += ` (\`${d.codeSnippet}\`)`;
							}
							return res;
						}).join("\n - ");
				log.verbose(message);
				log.verbose(resourcePath + ":\n" + contentWithMarkers.join("\n"));
				context.addLintingMessage(resourcePath, MESSAGE.AUTOFIX_ERROR, {message});
			} else {
				log.verbose(`Autofix applied to ${resourcePath}`);
				res.set(resourcePath, newContent);
			}
		}
	}

	return res;
}

function applyFixes(
	checker: ts.TypeChecker, sourceFile: ts.SourceFile, resourcePath: ResourcePath,
	messages: RawLintMessage[]
): string | undefined {
	const content = sourceFile.getFullText();

	const changeSet: ChangeSet[] = [];
	const fixes = messages.filter((msg) => !!msg.fix);
	generateChanges(resourcePath, checker, sourceFile, content, fixes, changeSet);

	if (changeSet.length === 0) {
		// No modifications needed
		return;
	}
	return applyChanges(content, changeSet);
}

function applyChanges(content: string, changeSet: ChangeSet[]): string {
	changeSet.sort((a, b) => b.start - a.start);
	const s = new MagicString(content);

	for (const change of changeSet) {
		switch (change.action) {
			case ChangeAction.INSERT:
				s.appendRight(change.start, change.value);
				break;
			case ChangeAction.REPLACE:
				s.update(change.start, change.end, change.value);
				break;
			case ChangeAction.DELETE:
				s.remove(change.start, change.end);
				break;
		}
	}
	return s.toString();
}
