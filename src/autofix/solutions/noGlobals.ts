import ts from "typescript";
import type {RawLintMessage} from "../../linter/LinterContext.js";
import {MESSAGE} from "../../linter/messages.js";
import type {
	ChangeSet,
	ExistingModuleDeclarationInfo,
	GlobalPropertyAccessNodeInfo,
	ModuleDeclarationInfo,
	NewModuleDeclarationInfo,
	Position,
} from "../autofix.js";
import {findGreatestAccessExpression, matchPropertyAccessExpression} from "../utils.js";
import parseModuleDeclaration from "../../linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";
import parseRequire from "../../linter/ui5Types/amdTranspiler/parseRequire.js";
import {getLogger} from "@ui5/logger";

const log = getLogger("linter:autofix:NoGlobals");

export default function generateSolutionNoGlobals(
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
		if (!msg.fixHints?.moduleName) {
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
			moduleName: msg.fixHints.moduleName,
			exportName: msg.fixHints.exportName,
			propertyAccess: msg.fixHints.propertyAccess,
			position: {
				line,
				column,
				pos,
			},
		});
	}

	const moduleDeclarations = new Map<ts.CallExpression, ExistingModuleDeclarationInfo>();

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
				try {
					moduleDeclarations.set(node, {
						moduleDeclaration: parseModuleDeclaration(node.arguments, checker),
						importRequests: new Map(),
					});
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : String(err);
					log.verbose(`Failed to parse sap.ui.define ` +
						`call in ${sourceFile.fileName}: ${errorMessage}`);
				}
			} else if (matchPropertyAccessExpression(node.expression, "sap.ui.require")) {
				try {
					const requireExpression = parseRequire(node.arguments, checker);
					// Only handle async require calls, not sap.ui.require probing
					if (requireExpression.async) {
						moduleDeclarations.set(node, {
							moduleDeclaration: requireExpression,
							importRequests: new Map(),
						});
					}
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : String(err);
					log.verbose(`Failed to parse sap.ui.require ` +
						`call in ${sourceFile.fileName}: ${errorMessage}`);
				}
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

	function getModuleDeclarationForPosition(position: Position): ModuleDeclarationInfo | undefined {
		const potentialDeclarations: {declaration: ModuleDeclarationInfo; start: number}[] = [];
		for (const [_, moduleDeclarationInfo] of moduleDeclarations) {
			const {moduleDeclaration} = moduleDeclarationInfo;
			const factory = "factory" in moduleDeclaration ? moduleDeclaration.factory : moduleDeclaration.callback;
			if (!factory || factory.getStart() > position.pos || factory.getEnd() < position.pos) {
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

	for (const nodeInfo of affectedNodesInfo) {
		const {moduleName, position} = nodeInfo;
		let moduleDeclarationInfo: ModuleDeclarationInfo | undefined = getModuleDeclarationForPosition(position);
		if (!moduleDeclarationInfo) {
			if (!newModuleDeclarations.length) {
				// throw new Error(`TODO: Implement handling for global access without module declaration`);
			}
			for (const decl of newModuleDeclarations) {
				if (position.pos > decl.declareCall.getStart()) {
					moduleDeclarationInfo = decl;
				} else {
					break;
				}
			}
		}
		if (!moduleDeclarationInfo) {
			// throw new Error(`TODO: Implement handling for global access without module declaration`);
		}

		if (moduleDeclarationInfo && !moduleDeclarationInfo.importRequests.has(moduleName)) {
			moduleDeclarationInfo.importRequests.set(moduleName, {
				nodeInfos: [],
			});
		}
		moduleDeclarationInfo?.importRequests.get(moduleName)!.nodeInfos.push(nodeInfo);
	}

	return moduleDeclarations;
}
