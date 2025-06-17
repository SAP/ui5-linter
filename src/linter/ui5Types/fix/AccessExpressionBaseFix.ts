import ts from "typescript";
import {PositionInfo} from "../../LinterContext.js";
import BaseFix, {BaseFixParams, FixScope} from "./BaseFix.js";
import {countChildNodesRecursive, isAssignment} from "../utils/utils.js";
import {FixHelpers} from "./Fix.js";

export interface AccessExpressionBaseFixParams extends BaseFixParams {
	/**
	 * Which scope, i.e. number of access expression counting from the root should the replacement affect.
	 * Examples for the code "sap.module.property":
	 * - "scope = 0" will replace the whole "sap.module.property"
	 * - "scope = 1" will replace "sap.module.method"
	 * - "scope = 2" will replace "sap.module"
	 *
	 * If not set, the default value is 0.
	 */
	scope?: number | FixScope;
}

/**
 * Fix a property access. This could also be the property access of a call expression, allowing for a more general
 * replacement in cases where the arguments or other conditions of the call expression do not matter.
 */
export default abstract class AccessExpressionBaseFix extends BaseFix {
	protected nodeTypes = [ts.SyntaxKind.PropertyAccessExpression, ts.SyntaxKind.ElementAccessExpression];
	private containedAccessExpressionCount = 0;

	constructor(protected params: AccessExpressionBaseFixParams) {
		super(params);
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo, _helpers: FixHelpers) {
		if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node) && !ts.isCallExpression(node)) {
			// CallExpression is acceptable as well since the starting position is the same as the contained
			// access expression
			// Even though this is a fix for access expressions, it is often used for call expressions in cases where
			// the call arguments do not matter. This allows for a more general replacement.
			return false;
		}
		if (!ts.isCallExpression(node) && isAssignment(node)) {
			return false;
		}
		this.sourcePosition = sourcePosition;

		// This might be a partial access expression, e.g. "sap.module" of sap.module.property.method" or
		// part of a chain, e.g. "sap.module.property.method().anotherMethod()".
		// In that case, the starting position won't be enough to find the correct node in the autofix AST
		// To solve this, we need to count the number of access expressions in the node
		let accessExpressionNode: ts.Node = node;
		while (ts.isCallExpression(accessExpressionNode)) {
			// Since we are accepting call expressions here but do not search for them, we will have to ignore
			// the call expression itself and only count the access expressions inside it.
			accessExpressionNode = accessExpressionNode.expression;
		}
		this.containedAccessExpressionCount = countChildNodesRecursive(accessExpressionNode, this.nodeTypes);
		return true;
	}

	visitAutofixNode(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) {
			return false;
		}

		const count = countChildNodesRecursive(node, this.nodeTypes);
		if (count !== this.containedAccessExpressionCount) {
			// The number of access expressions does not match the expected count
			// Reject this node and wait for it's child
			return false;
		}

		let relevantNode: ts.Node = node;
		for (let i = 0; i < (this.params.scope ?? 0); i++) {
			if (!ts.isPropertyAccessExpression(relevantNode) &&
				!ts.isElementAccessExpression(relevantNode)) {
				return false;
			}
			relevantNode = relevantNode.expression;
		}
		if (!this.requestsModuleOrGlobal) {
			// If no module or global is requested, we assume the current property access should stay.
			// Therefore, ignore the expression of the "relevant node" and start at the name
			if (!ts.isPropertyAccessExpression(relevantNode)) {
				// We can't replace an element access expression like this
				return false;
			}
			this.startPos = relevantNode.name.getStart(sourceFile);
		} else {
			this.startPos = relevantNode.getStart(sourceFile);
		}
		this.endPos = relevantNode.getEnd();
		return true;
	}
}
