import ts from "typescript";
import MagicString from "magic-string";
import LinterContext, {RawLintMessage, ResourcePath} from "../linter/LinterContext.js";
import {MESSAGE} from "../linter/messages.js";
import {ModuleDeclaration} from "../linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";
import generateSolutionNoGlobals from "./solutions/noGlobals.js";
import {getLogger} from "@ui5/logger";
import {addDependencies} from "./solutions/amdImports.js";

const log = getLogger("linter:autofix");

export interface AutofixResource {
	content: string;
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

interface InsertChange extends AbstractChangeSet {
	action: ChangeAction.INSERT;
	value: string;
}

interface ReplaceChange extends AbstractChangeSet {
	action: ChangeAction.REPLACE;
	end: number;
	value: string;
}

interface DeleteChange extends AbstractChangeSet {
	action: ChangeAction.DELETE;
	end: number;
}

export type AutofixResult = Map<ResourcePath, string>;
type SourceFiles = Map<ResourcePath, ts.SourceFile>;

interface Position {
	line: number;
	column: number;
	pos: number;
}
export interface GlobalPropertyAccessNodeInfo {
	globalVariableName: string;
	namespace: string;
	moduleName: string;
	exportName?: string;
	propertyAccess?: string;
	position: Position;
	node?: ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
}

export interface DeprecatedApiAccessNode {
	apiName: string;
	position: Position;
	node?: ts.CallExpression | ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
}

export type ImportRequests = Map<string, {
	nodeInfos: (DeprecatedApiAccessNode | GlobalPropertyAccessNodeInfo)[];
	identifier?: string;
}>;

export type ModuleDeclarationInfo = ExistingModuleDeclarationInfo | NewModuleDeclarationInfo;

export interface ExistingModuleDeclarationInfo {
	moduleDeclaration: ModuleDeclaration;
	importRequests: ImportRequests;
}

export interface NewModuleDeclarationInfo {
	declareCall: ts.CallExpression;
	requireCalls: Map<string, ts.CallExpression[]>;
	importRequests: ImportRequests;
	endPos?: number;
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

function getJsErrors(code: string, resourcePath: string) {
	const sourceFile = ts.createSourceFile(
		resourcePath,
		code,
		ts.ScriptTarget.ES2022,
		true,
		ts.ScriptKind.JS
	);

	const host = createCompilerHost(new Map([[resourcePath, sourceFile]]));
	const program = createProgram([resourcePath], host);
	const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);

	return diagnostics.filter(function (d) {
		return d.file === sourceFile && d.category === ts.DiagnosticCategory.Error;
	});
}

// eslint-disable-next-line @typescript-eslint/require-await
export default async function ({
	rootDir: _unused1,
	namespace: _unused2,
	resources,
	context,
}: AutofixOptions): Promise<AutofixResult> {
	const sourceFiles: SourceFiles = new Map();
	const resourcePaths = [];
	for (const [resourcePath, resource] of resources) {
		const sourceFile = ts.createSourceFile(
			resourcePath,
			resource.content,
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
		log.verbose(`Applying autofixes to ${resourcePath}`);
		const newContent = applyFixes(checker, sourceFile, resourcePath, resources.get(resourcePath)!);
		if (newContent) {
			const jsErrors = getJsErrors(newContent, resourcePath);
			if (jsErrors.length) {
				const message = `Syntax error after applying autofix for '${resourcePath}': ` +
					jsErrors.map((d) => d.messageText as string).join(", ");
				log.verbose(message);
				log.verbose(resourcePath + ":\n" + newContent);
				context.addLintingMessage(resourcePath, MESSAGE.PARSING_ERROR, {message});
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
	resource: AutofixResource
): string | undefined {
	const {content} = resource;

	// Collect modules of which at least one message has the conditional fixHint flag set
	const conditionalModuleAccess = new Set<string>();
	for (const msg of resource.messages) {
		if (msg.fixHints?.moduleName && msg.fixHints?.conditional) {
			log.verbose(`Skipping fixes that would import module '${msg.fixHints.moduleName}' ` +
				`because of conditional global access within the current file.`);
			conditionalModuleAccess.add(msg.fixHints.moduleName);
		}
	}

	// Group messages by id
	const messagesById = new Map<MESSAGE, RawLintMessage[]>();
	for (const msg of resource.messages) {
		if (msg.fixHints?.moduleName && conditionalModuleAccess.has(msg.fixHints.moduleName)) {
			// Skip messages with conditional fixHints
			continue;
		}
		if (!messagesById.has(msg.id)) {
			messagesById.set(msg.id, []);
		}
		messagesById.get(msg.id)!.push(msg);
	}

	const changeSet: ChangeSet[] = [];
	let existingModuleDeclarations = new Map<ts.CallExpression, ExistingModuleDeclarationInfo>();
	if (messagesById.has(MESSAGE.NO_GLOBALS)) {
		existingModuleDeclarations = generateSolutionNoGlobals(
			checker, sourceFile, content,
			messagesById.get(MESSAGE.NO_GLOBALS) as RawLintMessage<MESSAGE.NO_GLOBALS>[],
			changeSet, []);
	}

	for (const [defineCall, moduleDeclarationInfo] of existingModuleDeclarations) {
		addDependencies(defineCall, moduleDeclarationInfo, changeSet, resourcePath);
	}

	if (changeSet.length === 0) {
		// No modifications needed
		return undefined;
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
