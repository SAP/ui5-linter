import ts from "typescript";
import type {RawLintMessage} from "../../linter/LinterContext.js";
import {MESSAGE} from "../../linter/messages.js";
import {ChangeAction, type ChangeSet, type DeprecatedApiAccessNode, type NewModuleDeclarationInfo} from "../autofix.js";
import {
	findGreatestAccessExpression,
	matchPropertyAccessExpression,
	getImportForNamespace,
	getDeletableNode,
	getFirstArgument,
} from "../utils.js";

export default function generateSolutionDeprecatedApiAccess(
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
			// throw new Error(`Unable to find node for ${nodeInfo.apiName}`);
			// eslint-disable-next-line no-console
			console.error(`Unable to find node for ${nodeInfo.apiName}`);
		}
	}

	if (newModuleDeclarations.length === 1) {
		newModuleDeclarations[0].endPos = sourceFile.getEnd();
	} else if (newModuleDeclarations.length > 1) {
		throw new Error(`TODO: Implement handling for multiple module declarations`);
	}

	return newModuleDeclarations;
}
