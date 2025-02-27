import ts from "typescript";
import type {RawLintMessage} from "../../linter/LinterContext.js";
import {MESSAGE} from "../../linter/messages.js";
import type {
	ChangeSet,
	ExistingModuleDeclarationInfo,
	GlobalPropertyAccessNodeInfo,
	NewModuleDeclarationInfo,
} from "../autofix.js";
import {findGreatestAccessExpression, matchPropertyAccessExpression} from "../utils.js";
import parseModuleDeclaration from "../../linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";

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
		if (!msg.args.fixHints.moduleName) {
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
			moduleName: msg.args.fixHints.moduleName,
			exportName: msg.args.fixHints.exportName,
			propertyAccess: msg.args.fixHints.propertyAccess,
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
				// throw new Error(`TODO: Implement handling for global access without module declaration`);
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
			// throw new Error(`TODO: Implement handling for global access without module declaration`);
		}
		if (moduleDeclaration && !moduleDeclaration.importRequests.has(moduleName)) {
			moduleDeclaration.importRequests.set(moduleName, {
				nodeInfos: [],
			});
		}
		moduleDeclaration?.importRequests.get(moduleName)!.nodeInfos.push(nodeInfo);
	}

	return moduleDeclarations;
}
