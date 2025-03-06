import ts from "typescript";
import MagicString from "magic-string";
import LinterContext, {RawLintMessage, ResourcePath} from "../linter/LinterContext.js";
import {MESSAGE} from "../linter/messages.js";
import {ModuleDeclaration} from "../linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";
import generateSolutionNoGlobals from "./solutions/noGlobals.js";
import {collectModuleIdentifiers} from "./utils.js";
import {getLogger} from "@ui5/logger";
import {resolveUniqueName} from "../linter/ui5Types/utils/utils.js";

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

type ImportRequests = Map<string, {
	nodeInfos: (DeprecatedApiAccessNode | GlobalPropertyAccessNodeInfo)[];
	identifier?: string;
}>;

// type ModuleDeclarationInfo = ExistingModuleDeclarationInfo | NewModuleDeclarationInfo;

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
				context.addLintingMessage(resourcePath, MESSAGE.PARSING_ERROR, {message});
			} else {
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

	// Group messages by id
	const messagesById = new Map<MESSAGE, RawLintMessage[]>();
	for (const msg of resource.messages) {
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
		addDependencies(defineCall, moduleDeclarationInfo, changeSet);
	}

	if (changeSet.length === 0) {
		// No modifications needed
		return undefined;
	}
	return applyChanges(content, changeSet);
}

function addDependencies(
	defineCall: ts.CallExpression, moduleDeclarationInfo: ExistingModuleDeclarationInfo,
	changeSet: ChangeSet[]
) {
	const {moduleDeclaration, importRequests} = moduleDeclarationInfo;

	if (importRequests.size === 0) {
		return;
	}

	const declaredIdentifiers = collectModuleIdentifiers(moduleDeclaration.factory);

	const defineCallArgs = defineCall.arguments;
	const existingImportModules = defineCall.arguments && ts.isArrayLiteralExpression(defineCallArgs[0]) ?
			defineCallArgs[0].elements.map((el) => ts.isStringLiteralLike(el) ? el.text : "") :
			[];

	if (!ts.isFunctionLike(moduleDeclaration.factory)) {
		throw new Error("Invalid factory function");
	}
	const existingIdentifiers = moduleDeclaration.factory
		.parameters.map((param: ts.ParameterDeclaration) => (param.name as ts.Identifier).text ?? "__destructured__");
	const existingIdentifiersLength = existingIdentifiers.length;

	const imports = [...importRequests.keys()];

	const identifiersForExistingImports: string[] = [];
	let existingIdentifiersCut = 0;
	existingImportModules.forEach((existingModule, index) => {
		const indexOf = imports.indexOf(existingModule);
		const identifierName = existingIdentifiers[index] ||
			resolveUniqueName(existingModule, declaredIdentifiers);
		declaredIdentifiers.add(identifierName);
		identifiersForExistingImports.push(identifierName);
		if (indexOf !== -1 &&
			// Destructuring
			!(indexOf === index && existingIdentifiers[index] === "__destructured__")) {
			// If there are defined dependencies, but identifiers for them are missing,
			// and those identifiers are needed in the code, then we need to find out
			// up to which index we need to build identifiers and cut the rest.
			existingIdentifiersCut = index > existingIdentifiersCut ? (index + 1) : existingIdentifiersCut;
			imports.splice(indexOf, 1);
			importRequests.get(existingModule)!.identifier = identifierName;
		}
	});

	// Cut identifiers that are already there
	identifiersForExistingImports.splice(existingIdentifiersCut);

	const dependencies = imports.map((i) => `"${i}"`);
	const identifiers = [
		...identifiersForExistingImports,
		...imports.map((i) => {
			const identifier = resolveUniqueName(i, declaredIdentifiers);
			declaredIdentifiers.add(identifier);
			importRequests.get(i)!.identifier = identifier;
			return identifier;
		})];

	if (dependencies.length) {
		// Add dependencies
		if (moduleDeclaration.dependencies) {
			const depsNode = defineCall.arguments[0];
			const depElementNodes = depsNode && ts.isArrayLiteralExpression(depsNode) ? depsNode.elements : [];
			const insertAfterElement = depElementNodes[existingIdentifiersLength - 1] ??
				depElementNodes[depElementNodes.length - 1];

			if (insertAfterElement) {
				changeSet.push({
					action: ChangeAction.INSERT,
					start: insertAfterElement.getEnd(),
					value: (existingImportModules.length ? ", " : "") + dependencies.join(", "),
				});
			} else {
				changeSet.push({
					action: ChangeAction.REPLACE,
					start: depsNode.getFullStart(),
					end: depsNode.getEnd(),
					value: `[${dependencies.join(", ")}]`,
				});
			}
		} else {
			changeSet.push({
				action: ChangeAction.INSERT,
				start: defineCall.arguments[0].getFullStart(),
				value: `[${dependencies.join(", ")}], `,
			});
		}
	}

	if (identifiers.length) {
		const closeParenToken = moduleDeclaration.factory.getChildren()
			.find((c) => c.kind === ts.SyntaxKind.CloseParenToken);
		// Factory arguments
		const syntaxList = moduleDeclaration.factory.getChildren()
			.find((c) => c.kind === ts.SyntaxKind.SyntaxList);
		if (!syntaxList) {
			throw new Error("Invalid factory syntax");
		}

		// Patch factory arguments
		const value = (existingIdentifiersLength ? ", " : "") + identifiers.join(", ");
		if (!closeParenToken) {
			changeSet.push({
				action: ChangeAction.INSERT,
				start: syntaxList.getStart(),
				value: "(",
			});
			changeSet.push({
				action: ChangeAction.INSERT,
				start: syntaxList.getEnd(),
				value: `${value})`,
			});
		} else {
			let start = syntaxList.getEnd();

			// Existing trailing comma: Insert new args before it, to keep the trailing comma
			const lastSyntaxListChild = syntaxList.getChildAt(syntaxList.getChildCount() - 1);
			if (lastSyntaxListChild?.kind === ts.SyntaxKind.CommaToken) {
				start = lastSyntaxListChild.getStart();
			}

			changeSet.push({
				action: ChangeAction.INSERT,
				start,
				value,
			});
		}
	}

	// Patch identifiers
	patchIdentifiers(importRequests, changeSet);
}

function patchIdentifiers(importRequests: ImportRequests, changeSet: ChangeSet[]) {
	for (const {nodeInfos, identifier} of importRequests.values()) {
		if (!identifier) {
			throw new Error("No identifier found for import");
		}

		for (const nodeInfo of nodeInfos) {
			let node: ts.Node = nodeInfo.node!;

			if ("namespace" in nodeInfo && nodeInfo.namespace === "sap.ui.getCore") {
				node = node.parent;
			}
			const nodeStart = node.getStart();
			const nodeEnd = node.getEnd();
			const nodeReplacement = `${identifier}`;

			changeSet.push({
				action: ChangeAction.REPLACE,
				start: nodeStart,
				end: nodeEnd,
				value: nodeReplacement,
			});
		}
	}
}

function applyChanges(content: string, changeSet: ChangeSet[]): string {
	changeSet.sort((a, b) => a.start - b.start);
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
