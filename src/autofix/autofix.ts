import ts from "typescript";
import MagicString from "magic-string";
import LinterContext, {RawLintMessage, ResourcePath} from "../linter/LinterContext.js";
import {MESSAGE} from "../linter/messages.js";
import {ModuleDeclaration} from "../linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";
import generateSolutionNoGlobals from "./solutions/noGlobals.js";
import {getLogger} from "@ui5/logger";
import {addDependencies, removeDependencies} from "./solutions/amdImports.js";
import {RequireExpression} from "../linter/ui5Types/amdTranspiler/parseRequire.js";
import {Resource} from "@ui5/fs";
import {collectIdentifiers} from "./utils.js";
import {type FixHints} from "../linter/ui5Types/fixHints/FixHints.js";
import generateSolutionCodeReplacer from "./solutions/codeReplacer.js";

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

interface InsertChange extends AbstractChangeSet {
	action: ChangeAction.INSERT;
	value: string;
}

export interface ReplaceChange extends AbstractChangeSet {
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

export interface Position {
	line: number;
	column: number;
	pos: number;
}
export interface GlobalPropertyAccessNodeInfo {
	moduleName: string;
	exportNameToBeUsed?: string;
	exportCodeToBeUsed?: FixHints["exportCodeToBeUsed"];
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
	moduleDeclaration: ModuleDeclaration | RequireExpression;
	importRequests: ImportRequests;
	additionalNodeInfos: (DeprecatedApiAccessNode | GlobalPropertyAccessNodeInfo)[];
}

export interface NewModuleDeclarationInfo {
	declareCall: ts.CallExpression;
	requireCalls: Map<string, ts.CallExpression[]>;
	importRequests: ImportRequests;
	additionalNodeInfos: (DeprecatedApiAccessNode | GlobalPropertyAccessNodeInfo)[];
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

function getAutofixMessages(resource: AutofixResource) {
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

	return messagesById;
}

export function getModuleDeclarationForPosition(
	position: number, moduleDeclarations: Map<ts.CallExpression, ExistingModuleDeclarationInfo>
): ModuleDeclarationInfo | undefined {
	const potentialDeclarations: {declaration: ModuleDeclarationInfo; start: number}[] = [];
	for (const [_, moduleDeclarationInfo] of moduleDeclarations) {
		const {moduleDeclaration} = moduleDeclarationInfo;
		const factory = "factory" in moduleDeclaration ? moduleDeclaration.factory : moduleDeclaration.callback;
		if (!factory || factory.getStart() > position || factory.getEnd() < position) {
			continue;
		}
		potentialDeclarations.push({
			declaration: moduleDeclarationInfo,
			start: factory.getStart(),
		});
	}
	// Sort by start position so that the declaration closest to the position is returned
	// This is relevant in case of nested sap.ui.require calls
	potentialDeclarations.sort((a, b) => a.start - b.start);
	return potentialDeclarations.pop()?.declaration;
}

export default async function ({
	rootDir: _unused1,
	namespace: _unused2,
	resources: autofixResources,
	context,
}: AutofixOptions): Promise<AutofixResult> {
	// Group messages by ID and only process files for which fixes are available
	const messages = new Map<string, Map<MESSAGE, RawLintMessage[]>>();
	const resources: Resource[] = [];
	for (const [_, autofixResource] of autofixResources) {
		const messagesById = getAutofixMessages(autofixResource);
		// Currently only global access autofixes are supported
		// This needs to stay aligned with the applyFixes function
		if (messagesById.has(MESSAGE.NO_GLOBALS) ||
			messagesById.has(MESSAGE.DEPRECATED_API_ACCESS) ||
			messagesById.has(MESSAGE.DEPRECATED_FUNCTION_CALL)) {
			messages.set(autofixResource.resource.getPath(), messagesById);
			resources.push(autofixResource.resource);
		}
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
		log.verbose(`Applying autofixes to ${resourcePath}`);
		const newContent = applyFixes(checker, sourceFile, resourcePath, messages.get(resourcePath)!);
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
	messagesById: Map<MESSAGE, RawLintMessage[]>
): string | undefined {
	const content = sourceFile.getFullText();

	const changeSet: ChangeSet[] = [];
	let existingModuleDeclarations = new Map<ts.CallExpression, ExistingModuleDeclarationInfo>();
	const messages: RawLintMessage<
		MESSAGE.NO_GLOBALS | MESSAGE.DEPRECATED_API_ACCESS | MESSAGE.DEPRECATED_FUNCTION_CALL>[] = [];

	if (messagesById.has(MESSAGE.NO_GLOBALS)) {
		messages.push(
			...messagesById.get(MESSAGE.NO_GLOBALS) as RawLintMessage<MESSAGE.NO_GLOBALS>[]
		);
	}

	if (messagesById.has(MESSAGE.DEPRECATED_API_ACCESS)) {
		messages.push(
			...messagesById.get(MESSAGE.DEPRECATED_API_ACCESS) as RawLintMessage<MESSAGE.DEPRECATED_API_ACCESS>[]
		);
	}

	if (messagesById.has(MESSAGE.DEPRECATED_FUNCTION_CALL)) {
		messages.push(
			...messagesById.get(MESSAGE.DEPRECATED_FUNCTION_CALL) as RawLintMessage<MESSAGE.DEPRECATED_FUNCTION_CALL>[]
		);
	}

	if (messages.length === 0) {
		return undefined;
	}

	existingModuleDeclarations = generateSolutionNoGlobals(
		checker, sourceFile, content,
		messages,
		changeSet, []);

	// Collect all identifiers in the source file to ensure unique names when adding imports
	const identifiers = collectIdentifiers(sourceFile);

	for (const [defineCall, moduleDeclarationInfo] of existingModuleDeclarations) {
		// TODO: Find a better way to define modules for removal
		const moduleRemovals = new Set(["sap/base/strings/NormalizePolyfill", "jquery.sap.unicode"]);

		// Remove dependencies from the existing module declaration
		removeDependencies(moduleRemovals,
			moduleDeclarationInfo, changeSet, resourcePath, identifiers);

		// Resolve dependencies for the module declaration
		addDependencies(defineCall, moduleDeclarationInfo, changeSet, resourcePath, identifiers, moduleRemovals);
	}

	// More complex code replacers. Mainly arguments shifting and repositioning, replacements,
	// based on arguments' context
	generateSolutionCodeReplacer(existingModuleDeclarations, messages, changeSet, sourceFile, identifiers);

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
