import ts from "typescript";
import MagicString from "magic-string";
import {toPosStr} from "../linter/ui5Types/amdTranspiler/util.js";
import {RawLintMessage, ResourcePath} from "../linter/LinterContext.js";
import {MESSAGE} from "../linter/messages.js";
import parseModuleDeclaration, {ModuleDeclaration} from "../linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";
import pruneNode from "../linter/ui5Types/amdTranspiler/pruneNode.js";
import {getPropertyNameText} from "../linter/ui5Types/utils.js";

export interface AutofixResource {
	content: string;
	messages: RawLintMessage[];
}

export interface AutofixOptions {
	rootDir: string;
	namespace?: string;
	resources: Map<ResourcePath, AutofixResource>;
}

enum ChangeAction {
	INSERT = "insert",
	REPLACE = "replace",
	DELETE = "delete",
}

type ChangeSet = InsertChange | ReplaceChange | DeleteChange;

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
		const newContent = applyFixes(checker, sourceFile, resourcePath, resources.get(resourcePath)!);
		if (newContent) {
			res.set(resourcePath, newContent);
		}
	}

	return res;
}

function applyFixes(
	checker: ts.TypeChecker, sourceFile: ts.SourceFile, resourcePath: ResourcePath, resource: AutofixResource
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
		addDependencies(defineCall, moduleDeclarationInfo, changeSet);
	}

	if (changeSet.length === 0) {
		// No modifications needed
		return undefined;
	}
	return applyChanges(content, changeSet);
}
interface Position {
	line: number;
	column: number;
	pos: number;
}
interface GlobalPropertyAccessNodeInfo {
	globalVariableName: string;
	namespace: string;
	moduleName: string;
	exportName?: string;
	propertyAccess?: string;
	position: Position;
	node?: ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
}

interface DeprecatedApiAccessNode {
	apiName: string;
	position: Position;
	node?: ts.CallExpression | ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
}

type ImportRequests = Map<string, {
	nodeInfos: (DeprecatedApiAccessNode | GlobalPropertyAccessNodeInfo)[];
	identifier?: string;
}>;

// type ModuleDeclarationInfo = ExistingModuleDeclarationInfo | NewModuleDeclarationInfo;

interface ExistingModuleDeclarationInfo {
	moduleDeclaration: ModuleDeclaration;
	importRequests: ImportRequests;
}

interface NewModuleDeclarationInfo {
	declareCall: ts.CallExpression;
	requireCalls: Map<string, ts.CallExpression[]>;
	importRequests: ImportRequests;
	endPos?: number;
}

function generateSolutionDeprecatedApiAccess(
	checker: ts.TypeChecker, sourceFile: ts.SourceFile, content: string,
	messages: RawLintMessage<MESSAGE.DEPRECATED_API_ACCESS>[],
	changeSet: ChangeSet[]
): NewModuleDeclarationInfo[] {
	// Collect all reported nodes
	const affectedNodesInfo = new Set<DeprecatedApiAccessNode>();
	for (const msg of messages) {
		if (!msg.position) {
			throw new Error(`Unable to produce solution for message without position`);
		}
		// TypeScript lines and columns are 0-based
		const line = msg.position.line - 1;
		const column = msg.position.column - 1;
		const pos = sourceFile.getPositionOfLineAndCharacter(line, column);
		affectedNodesInfo.add({
			apiName: msg.args.apiName,
			position: {
				line,
				column,
				pos,
			},
		});
	}

	const newModuleDeclarations: NewModuleDeclarationInfo[] = [];
	function visitNode(node: ts.Node) {
		for (const nodeInfo of affectedNodesInfo) {
			if (node.getStart() === nodeInfo.position.pos) {
				if (!ts.isIdentifier(node)) {
					continue;
					// throw new Error(`Expected node to be an Identifier but got ${ts.SyntaxKind[node.kind]}`);
				}
				const accessExp = findGreatestAccessExpression(node);
				if (ts.isCallExpression(accessExp.parent)) {
					const callExp = accessExp.parent;
					if (ts.isPropertyAccessExpression(callExp.expression)) {
						if (matchPropertyAccessExpression(callExp.expression, "jQuery.sap.declare")) {
							newModuleDeclarations.push({
								declareCall: callExp,
								requireCalls: new Map(),
								importRequests: new Map(),
							});
							affectedNodesInfo.delete(nodeInfo);
							const deletableNode = getDeletableNode(callExp);
							if (!deletableNode) {
								throw new Error(`Unable to find deletable node for ${nodeInfo.apiName}`);
							}
							changeSet.push({
								action: ChangeAction.DELETE,
								start: deletableNode.getStart(),
								end: deletableNode.getEnd(),
							});
							continue;
						} else if (matchPropertyAccessExpression(callExp.expression, "jQuery.sap.require")) {
							if (!newModuleDeclarations.length) {
								throw new Error(`TODO: Implement handling for require without declare`);
							}
							const moduleDeclaration = newModuleDeclarations[newModuleDeclarations.length - 1];
							const namespace = getFirstArgument(callExp);
							const importName = getImportForNamespace(namespace);
							if (!moduleDeclaration.requireCalls.has(importName)) {
								moduleDeclaration.requireCalls.set(importName, []);
							}
							moduleDeclaration.requireCalls.get(importName)!.push(callExp);
							affectedNodesInfo.delete(nodeInfo);
							const deletableNode = getDeletableNode(callExp);
							if (!deletableNode) {
								throw new Error(`Unable to find deletable node for ${nodeInfo.apiName}`);
							}
							changeSet.push({
								action: ChangeAction.DELETE,
								start: deletableNode.getStart(),
								end: deletableNode.getEnd(),
							});
							continue;
						} else if (matchPropertyAccessExpression(callExp.expression, "jQuery.sap.formatMessage")) {
							const moduleDeclaration = newModuleDeclarations[newModuleDeclarations.length - 1];

							// Add Import
							const importName = "sap/base/strings/formatMessage";
							if (!moduleDeclaration.requireCalls.has(importName)) {
								moduleDeclaration.requireCalls.set(importName, []);
							}
							moduleDeclaration.requireCalls.get(importName)!.push(callExp);

							// Ensure update of usage
							if (!moduleDeclaration.importRequests.has(importName)) {
								moduleDeclaration.importRequests.set(importName, {
									nodeInfos: [],
								});
							}
							moduleDeclaration.importRequests.get(importName)!.nodeInfos.push(nodeInfo);
							nodeInfo.node = accessExp;

							continue;
						}
					}
				} else {
					nodeInfo.node = accessExp;
				}
			}
		}
		ts.forEachChild(node, visitNode);
	}
	ts.forEachChild(sourceFile, visitNode);
	for (const nodeInfo of affectedNodesInfo) {
		if (!nodeInfo.node) {
			throw new Error(`Unable to find node for ${nodeInfo.apiName}`);
		}
	}

	if (newModuleDeclarations.length === 1) {
		newModuleDeclarations[0].endPos = sourceFile.getEnd();
	} else {
		throw new Error(`TODO: Implement handling for multiple module declarations`);
	}

	return newModuleDeclarations;
}

function generateSolutionNoGlobals(
	checker: ts.TypeChecker, sourceFile: ts.SourceFile, content: string,
	messages: RawLintMessage<MESSAGE.NO_GLOBALS>[],
	changeSet: ChangeSet[], newModuleDeclarations: NewModuleDeclarationInfo[]
) {
	// Collect all global property access nodes
	const affectedNodesInfo = new Set<GlobalPropertyAccessNodeInfo>();
	for (const msg of messages) {
		if (!msg.position) {
			throw new Error(`Unable to produce solution for message without position`);
		}
		if (!msg.args.moduleName) {
			// Skip global access without module name
			continue;
		}
		// TypeScript lines and columns are 0-based
		const line = msg.position.line - 1;
		const column = msg.position.column - 1;
		const pos = sourceFile.getPositionOfLineAndCharacter(line, column);
		affectedNodesInfo.add({
			globalVariableName: msg.args.variableName,
			namespace: msg.args.namespace,
			moduleName: msg.args.moduleName,
			exportName: msg.args.exportName,
			propertyAccess: msg.args.propertyAccess,
			position: {
				line,
				column,
				pos,
			},
		});
	}

	const sapUiDefineCalls: ts.CallExpression[] = [];
	function visitNode(node: ts.Node) {
		for (const nodeInfo of affectedNodesInfo) {
			if (node.getStart() === nodeInfo.position.pos) {
				if (!ts.isIdentifier(node)) {
					continue;
					// throw new Error(`Expected node to be an Identifier but got ${ts.SyntaxKind[node.kind]}`);
				}
				nodeInfo.node = findGreatestAccessExpression(node, nodeInfo.propertyAccess);
			}
		}

		if (ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression)) {
			if (matchPropertyAccessExpression(node.expression, "sap.ui.define")) {
				sapUiDefineCalls.push(node);
			}
		}
		ts.forEachChild(node, visitNode);
	}
	ts.forEachChild(sourceFile, visitNode);
	for (const nodeInfo of affectedNodesInfo) {
		if (!nodeInfo.node) {
			throw new Error(`Unable to find node for ${nodeInfo.globalVariableName}`);
		}
	}

	const moduleDeclarations = new Map<ts.CallExpression, ExistingModuleDeclarationInfo>();

	for (const nodeInfo of affectedNodesInfo) {
		const {moduleName, position} = nodeInfo;
		// Find relevant sap.ui.define call
		let defineCall: ts.CallExpression | undefined | null;
		if (sapUiDefineCalls.length === 1) {
			defineCall = sapUiDefineCalls[0];
		} else if (sapUiDefineCalls.length > 1) {
			for (const sapUiDefineCall of sapUiDefineCalls) {
				if (sapUiDefineCall.getStart() < position.pos) {
					defineCall = sapUiDefineCall;
				}
			}
		}
		if (defineCall === undefined) {
			defineCall = null;
		}
		let moduleDeclaration;
		if (defineCall) {
			if (!moduleDeclarations.has(defineCall)) {
				moduleDeclarations.set(defineCall, {
					moduleDeclaration: parseModuleDeclaration(defineCall.arguments, checker),
					importRequests: new Map(),
				});
			}
			moduleDeclaration = moduleDeclarations.get(defineCall)!;
		} else {
			if (!newModuleDeclarations.length) {
				throw new Error(`TODO: Implement handling for global access without module declaration`);
			}
			for (const decl of newModuleDeclarations) {
				if (position.pos > decl.declareCall.getStart()) {
					moduleDeclaration = decl;
				} else {
					break;
				}
			}
		}
		if (!moduleDeclaration) {
			throw new Error(`TODO: Implement handling for global access without module declaration`);
		}
		if (!moduleDeclaration.importRequests.has(moduleName)) {
			moduleDeclaration.importRequests.set(moduleName, {
				nodeInfos: [],
			});
		}
		moduleDeclaration.importRequests.get(moduleName)!.nodeInfos.push(nodeInfo);
	}

	return moduleDeclarations;
}

function findGreatestAccessExpression(node: ts.Identifier, matchPropertyAccess?: string):
	ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression {
	type Candidate = ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
	let scanNode: Candidate = node;
	let propertyAccessChain: string[] = [];
	if (matchPropertyAccess) {
		propertyAccessChain = matchPropertyAccess.split(".");
		if (node.text !== "window") {
			const firstPropAccess = propertyAccessChain.shift();
			if (node.text !== firstPropAccess) {
				throw new Error(`Expected node to be ${firstPropAccess} but got ${node.getText()}`);
			}
		}
	}
	while (ts.isPropertyAccessExpression(scanNode.parent) || ts.isElementAccessExpression(scanNode.parent)) {
		scanNode = scanNode.parent;
		if (matchPropertyAccess) {
			const nextPropertyAccess = propertyAccessChain.shift();

			let propName;
			if (ts.isPropertyAccessExpression(scanNode)) {
				propName = getPropertyNameText(scanNode.name);
			} else {
				if (
					ts.isStringLiteralLike(scanNode.argumentExpression) ||
					ts.isNumericLiteral(scanNode.argumentExpression)
				) {
					propName = scanNode.argumentExpression.text;
				} else {
					propName = scanNode.argumentExpression.getText();
				}
			}
			if (propName !== nextPropertyAccess) {
				throw new Error(`Expected node to be ${nextPropertyAccess} but got ${propName}`);
			}
			if (!propertyAccessChain.length) {
				return scanNode;
			}
		}
	}
	return scanNode;
}

function matchPropertyAccessExpression(node: ts.PropertyAccessExpression, match: string): boolean {
	const propAccessChain: string[] = [];
	propAccessChain.push(node.expression.getText());

	let scanNode: ts.Node = node;
	while (ts.isPropertyAccessExpression(scanNode)) {
		propAccessChain.push(scanNode.name.getText());
		scanNode = scanNode.parent;
	}
	return propAccessChain.join(".") === match;
}

function getImportForNamespace(namespace: string): string {
	namespace = namespace.replace(/^(?:window|globalThis|self)./, "");
	if (namespace.startsWith("sap.")) {
		if (namespace === "sap.ui.getCore") {
			return "sap/ui/core/Core";
		}
		return namespace.replaceAll(".", "/");
	} else if (namespace === "jQuery") {
		return "sap/ui/thirdparty/jquery";
	} else {
		throw new Error(`Unsupported namespace ${namespace}`);
	}
}

// function getImportForGlobalVariable(globalVariableName: string, namespace: string): string {
// 	namespace = namespace.replace(/^(?:window|globalThis|self)./, "");
// 	switch (globalVariableName) {
// 		case "sap":
// 			if (!namespace.startsWith("sap.")) {
// 				throw new Error(`Unsupported namespace ${namespace}`);
// 			}
// 			if (namespace === "sap.ui.getCore") {
// 				return "sap/ui/core/Core";
// 			}
// 			return namespace.replaceAll(".", "/");
// 		case "jQuery":
// 			return "sap/ui/thirdparty/jquery";
// 		default:
// 			throw new Error(`Unsupported global variable ${globalVariableName}`);
// 	}
// }

function addDependencies(
	defineCall: ts.CallExpression, moduleDeclarationInfo: ExistingModuleDeclarationInfo, changeSet: ChangeSet[]
) {
	const {moduleDeclaration, importRequests} = moduleDeclarationInfo;
	if (moduleDeclaration.dependencies) {
		throw new Error("TODO: Implement sap.ui.define extending existing dependencies");
	}

	if (!ts.isFunctionExpression(moduleDeclaration.factory)) {
		throw new Error("TODO: Unsupported factory declaration");
	}

	const imports = [...importRequests.keys()];
	const dependencies = imports.map((i) => `"${i}"`);
	const identifiers = imports.map((i) => {
		const identifier = getIdentifierForImport(i);
		importRequests.get(i)!.identifier = identifier;
		return identifier;
	});

	// Patch dependencies argument
	const dependencyDecl = `[${dependencies.join(", ")}], `;
	changeSet.push({
		action: ChangeAction.INSERT,
		start: moduleDeclaration.factory.getFullStart(),
		value: dependencyDecl,
	});

	// Patch factory arguments
	const closeParenToken = moduleDeclaration.factory.getChildren()
		.find((c) => c.kind === ts.SyntaxKind.CloseParenToken);
	if (!closeParenToken) {
		throw new Error("TODO: Implement missing close paren token");
	}
	changeSet.push({
		action: ChangeAction.INSERT,
		start: closeParenToken.getStart(),
		value: identifiers.join(", "),
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
			let nodeReplacement = `${identifier}`;

			// FIXME: Add proper handling of adding return statements for the declared class.
			// This could be solved by looking for a matching extend call with the same class name as the
			// jQuery.sap.declare call. Note that a local variable might need to be introduced as some code
			// might e.g. add methods on the class prototype before returning the class.
			if (nodeReplacement === "UIComponent") {
				nodeReplacement = "return " + nodeReplacement;
			} else if ("namespace" in nodeInfo && nodeInfo.namespace === "sap.ui.controller") {
				// Check whether sap.ui.controller was used to define or create a controller
				if (ts.isCallExpression(node.parent) && node.parent.arguments.length === 1) {
					// Creating a controller instance can't be easily replaced as the new API is async
					continue;
				} else {
					// Controller definition
					nodeReplacement = `return ${nodeReplacement}.extend`;
				}
			}

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

function getIdentifierForImport(importName: string): string {
	const parts = importName.split("/");
	const identifier = parts[parts.length - 1];
	if (identifier === "jquery") {
		return "jQuery";
	}
	if (identifier === "library") {
		return parts[parts.length - 2] + "Library";
	}
	return identifier;
}

function getFirstArgument(callExp: ts.CallExpression): string {
	const firstArg = callExp.arguments[0];
	if (!firstArg) {
		throw new UnsupportedFinding(`Missing extends argument at ${toPosStr(callExp)}`);
	}
	if (firstArg && !ts.isStringLiteralLike(firstArg)) {
		throw new UnsupportedFinding(`Unexpected extends argument of type ${ts.SyntaxKind[firstArg.kind]} at ` +
			toPosStr(firstArg));
	}
	return firstArg.text;
}

function getDeletableNode(node: ts.Node): ts.Node | undefined {
	return pruneNode(node);
}

export class UnsupportedFinding extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}
