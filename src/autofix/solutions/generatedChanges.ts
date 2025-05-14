import ts from "typescript";
import type {RawLintMessage} from "../../linter/LinterContext.js";
import {MESSAGE} from "../../linter/messages.js";
import {
	getModuleDeclarationForPosition,
	Position,
	type ChangeSet,
	type ExistingModuleDeclarationInfo,
} from "../autofix.js";
import {findGreatestAccessExpression, matchPropertyAccessExpression} from "../utils.js";
import parseModuleDeclaration from "../../linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";
import parseRequire from "../../linter/ui5Types/amdTranspiler/parseRequire.js";
import {getLogger} from "@ui5/logger";
import Fix from "../../linter/ui5Types/fixHints/Fix.js";

const log = getLogger("linter:autofix:NoGlobals");

interface NodeSearchInfo {
	position: Position;
	fix: Fix;
	nodeType: ts.SyntaxKind;
}

export default function generatedChanges(
	checker: ts.TypeChecker, sourceFile: ts.SourceFile, content: string,
	messages: RawLintMessage<MESSAGE.NO_GLOBALS | MESSAGE.DEPRECATED_API_ACCESS | MESSAGE.DEPRECATED_FUNCTION_CALL>[],
	changeSet: ChangeSet[]
) {
	// Collect all global property access nodes
	const nodeSearchInfo = new Set<NodeSearchInfo>();
	for (const msg of messages) {
		if (!(msg.fixHints instanceof Fix)) {
			continue;
		}
		let fixStart = msg.fixHints.getStartPosition();
		fixStart ??= msg.position;
		if (!fixStart) {
			throw new Error(`Unable to find fix start position for message ${msg.id}`);
		}
		// TypeScript lines and columns are 0-based
		const line = fixStart.line - 1;
		const column = fixStart.column - 1;
		const pos = sourceFile.getPositionOfLineAndCharacter(line, column);

		nodeSearchInfo.add({
			fix: msg.fixHints,
			nodeType: msg.fixHints.getNodeType(),
			position: {
				line,
				column,
				pos,
			},
		});
	}

	const moduleDeclarations = new Map<ts.CallExpression, ExistingModuleDeclarationInfo>();

	function visitNode(node: ts.Node) {
		for (const nodeInfo of nodeSearchInfo) {
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
						additionalNodeInfos: [],
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
							additionalNodeInfos: [],
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
			throw new Error(`Unable to find node at position ${nodeInfo.position.line}:${nodeInfo.position.column}`);
		}
	}

	for (const nodeInfo of affectedNodesInfo) {
		const {moduleName, position} = nodeInfo;
		let moduleDeclarationInfo = getModuleDeclarationForPosition(position.pos, moduleDeclarations);
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

		if (moduleName) {
			if (moduleDeclarationInfo && !moduleDeclarationInfo.importRequests.has(moduleName)) {
				moduleDeclarationInfo.importRequests.set(moduleName, {
					nodeInfos: [],
				});
			}
			moduleDeclarationInfo?.importRequests.get(moduleName)!.nodeInfos.push(nodeInfo);
		} else {
			// We have a replacement without introducing a new module, e.g. replacement by Web API usage
			moduleDeclarationInfo?.additionalNodeInfos.push(nodeInfo);
		}
	}

	return moduleDeclarations;
}
