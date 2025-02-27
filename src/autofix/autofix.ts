import ts from "typescript";
import MagicString from "magic-string";
import LinterContext, {LintMetadata, RawLintMessage, ResourcePath} from "../linter/LinterContext.js";
import {MESSAGE} from "../linter/messages.js";
import {ModuleDeclaration} from "../linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";
import generateSolutionDeprecatedApiAccess from "./solutions/deprecatedApiAccess.js";
import generateSolutionNoGlobals from "./solutions/noGlobals.js";
import {getIdentifierForImport} from "./utils.js";

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

const compilerOptions = {
	checkJs: false,
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
		const newContent = applyFixes(checker, sourceFile, resourcePath, resources.get(resourcePath)!, context);
		if (newContent) {
			res.set(resourcePath, newContent);
		}
	}

	return res;
}

function applyFixes(
	checker: ts.TypeChecker, sourceFile: ts.SourceFile, resourcePath: ResourcePath,
	resource: AutofixResource, context: LinterContext
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
	let newModuleDeclarations: NewModuleDeclarationInfo[] = [];
	if (messagesById.has(MESSAGE.DEPRECATED_API_ACCESS)) {
		newModuleDeclarations = generateSolutionDeprecatedApiAccess(
			checker, sourceFile, content,
			messagesById.get(MESSAGE.DEPRECATED_API_ACCESS) as RawLintMessage<MESSAGE.DEPRECATED_API_ACCESS>[],
			changeSet);
	}
	let existingModuleDeclarations = new Map<ts.CallExpression, ExistingModuleDeclarationInfo>();
	if (messagesById.has(MESSAGE.NO_GLOBALS)) {
		existingModuleDeclarations = generateSolutionNoGlobals(
			checker, sourceFile, content,
			messagesById.get(MESSAGE.NO_GLOBALS) as RawLintMessage<MESSAGE.NO_GLOBALS>[],
			changeSet, newModuleDeclarations);
	}
	for (const moduleDeclaration of newModuleDeclarations) {
		addModuleDeclaration(moduleDeclaration, changeSet);
	}

	for (const [defineCall, moduleDeclarationInfo] of existingModuleDeclarations) {
		addDependencies(defineCall, moduleDeclarationInfo, changeSet, context.getMetadata(resourcePath));
	}

	if (changeSet.length === 0) {
		// No modifications needed
		return undefined;
	}
	return applyChanges(content, changeSet);
}

function addDependencies(
	defineCall: ts.CallExpression, moduleDeclarationInfo: ExistingModuleDeclarationInfo,
	changeSet: ChangeSet[], resourceMetadata: LintMetadata
) {
	const {moduleDeclaration, importRequests} = moduleDeclarationInfo;

	const existingImportModules = resourceMetadata.transformedImports.get("sap.ui.define") ?? [];
	const moduleWithoutIdentifier = existingImportModules.find((i) => !i.identifier);
	const existingIdentifiersLength = moduleWithoutIdentifier ?
			existingImportModules.indexOf(moduleWithoutIdentifier) :
		existingImportModules.length ?? 0;

	const imports = [...importRequests.keys()];
	existingImportModules.forEach((existingImportModule) => {
		const indexOf = imports.indexOf(existingImportModule.moduleName);
		if (indexOf !== -1) {
			imports.splice(indexOf, 1);
			importRequests.get(existingImportModule.moduleName)!.identifier = existingImportModule.identifier;
		}
	});

	const dependencies = imports.map((i) => `"${i}"`);
	const identifiers = [
		...existingImportModules.map((i) => i.identifier || getIdentifierForImport(i.moduleName))
			.slice(existingIdentifiersLength),
		...imports.map((i) => {
			const identifier = getIdentifierForImport(i);
			importRequests.get(i)!.identifier = identifier;
			return identifier;
		})];

	if (moduleDeclaration.dependencies) {
		const depsNode = defineCall.arguments[0];
		const depElementNodes = depsNode && ts.isArrayLiteralExpression(depsNode) ? depsNode.elements : [];
		const lastElement = depElementNodes[depElementNodes.length - 1];

		changeSet.push({
			action: ChangeAction.INSERT,
			start: lastElement.getEnd(),
			value: (existingIdentifiersLength && dependencies.length ? ", " : "") + dependencies.join(", "),
		});
	} else {
		changeSet.push({
			action: ChangeAction.INSERT,
			start: defineCall.arguments[0].getFullStart(),
			value: `[${dependencies.join(", ")}], `,
		});
	}

	const closeParenToken = moduleDeclaration.factory.getChildren()
		.find((c) => c.kind === ts.SyntaxKind.CloseParenToken);
	// Factory arguments
	const syntaxList = moduleDeclaration.factory.getChildren()
		.find((c) => c.kind === ts.SyntaxKind.SyntaxList);
	if (!syntaxList) {
		throw new Error("Invalid factory syntax");
	}

	// Patch factory arguments
	let value = (existingIdentifiersLength && dependencies.length ? ", " : "") + identifiers.join(", ");
	if (!closeParenToken) {
		changeSet.push({
			action: ChangeAction.INSERT,
			start: syntaxList.getStart(),
			value: "(",
		});
		value = `${value})`;
	}
	changeSet.push({
		action: ChangeAction.INSERT,
		start: syntaxList.getEnd(),
		value,
	});

	// Patch identifiers
	patchIdentifiers(importRequests, changeSet);
}

function addModuleDeclaration(
	moduleDeclarationInfo: NewModuleDeclarationInfo, changeSet: ChangeSet[]
) {
	const {declareCall, requireCalls, importRequests, endPos} = moduleDeclarationInfo;

	const imports = Array.from(new Set([...requireCalls.keys(), ...importRequests.keys()]));
	const dependencies = imports.map((i) => `"${i}"`);
	const identifiers = imports.map((i) => {
		const identifier = getIdentifierForImport(i);
		if (importRequests.has(i)) {
			importRequests.get(i)!.identifier = identifier;
		}
		return identifier;
	});

	// Create module declaration
	const dependencyDecl = `[${dependencies.join(", ")}], `;

	let moduleOpen = `sap.ui.define(`;

	// TODO: Decide whether or in which case we want to add the module name to the define call.
	// Usually it's omitted in our code and not mentioned in our best practices.
	// const namespace = getFirstArgument(declareCall).replace(/\./g, "/");
	// let moduleName = "";
	// if (namespace) {
	// moduleName = `"${namespace}", `;
	// }
	// moduleOpen += moduleName;

	moduleOpen += `${dependencyDecl}function(${identifiers.join(", ")}) {`;
	const moduleClose = "});\n";
	changeSet.push({
		action: ChangeAction.INSERT,
		start: declareCall.getStart(),
		value: moduleOpen,
	});

	changeSet.push({
		action: ChangeAction.INSERT,
		start: endPos!,
		value: moduleClose,
	});

	// Patch identifiers
	patchIdentifiers(importRequests, changeSet);
}

function patchIdentifiers(importRequests: ImportRequests, changeSet: ChangeSet[]) {
	for (const {nodeInfos, identifier} of importRequests.values()) {
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
