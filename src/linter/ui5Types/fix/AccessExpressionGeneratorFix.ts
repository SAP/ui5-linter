import ts from "typescript";
import {ChangeAction} from "../../../autofix/autofix.js";
import {PositionInfo} from "../../LinterContext.js";
import BaseFix, {BaseFixParams, FixScope} from "./BaseFix.js";

export interface AccessExpressionGeneratorFixParams extends BaseFixParams {
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

	/**
	 * The generator function will be used to determine the value of the replacement, affecting
	 * the whole access expression
	 *
	 * If the return value is undefined, no change will be generated
	 */
	generator: (identifierName: string | undefined) => string | undefined;
}

/**
 * Fix a property access. This could also be the property access of a call expression, allowing for a more general
 * replacement in cases where the arguments or other conditions of the call expression do not matter.
 */
export default class AccessExpressionGeneratorFix extends BaseFix {
	private accessExpressionCount = 0;
	constructor(protected params: AccessExpressionGeneratorFixParams) {
		super(params);
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo, _checker: ts.TypeChecker) {
		if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node) && !ts.isCallExpression(node)) {
			// CallExpression is acceptable as well since the starting position is the same as the contained
			// access expression
			return false;
		}
		this.sourcePosition = sourcePosition;

		// This might be a partial access expression, e.g. "sap.module" of sap.module.property.method"
		// In that case, the starting position won't be enough to find the correct node in the autofix AST
		// To solve this, we need to count the number of access expressions in the node
		if (ts.isCallExpression(node)) {
			// This can be ignored in case of a call expression, since the starting position is the same
			// as the contained access expression
			this.accessExpressionCount = -1;
			return true;
		}
		let currentNode: ts.Node = node;
		while (ts.isPropertyAccessExpression(currentNode) || ts.isElementAccessExpression(currentNode)) {
			this.accessExpressionCount++;
			currentNode = currentNode.expression;
		}
		return true;
	}

	getNodeSearchParameters() {
		if (this.sourcePosition === undefined) {
			throw new Error("Position for search is not defined");
		}
		return {
			nodeTypes: [ts.SyntaxKind.PropertyAccessExpression, ts.SyntaxKind.ElementAccessExpression],
			position: this.sourcePosition,
		};
	}

	visitAutofixNode(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) {
			return false;
		}

		if (this.accessExpressionCount !== -1) {
			// Check whether this node has the correct number of access expressions
			let currentNode: ts.Node = node;
			let count = 0;
			while (ts.isPropertyAccessExpression(currentNode) || ts.isElementAccessExpression(currentNode)) {
				count++;
				currentNode = currentNode.expression;
			}
			if (count !== this.accessExpressionCount) {
				// The number of access expressions does not match the expected count
				// Reject this node and wait for it's child
				return false;
			}
		}

		let relevantNode: ts.Node = node;
		for (let i = 0; i < (this.params.scope ?? 0); i++) {
			if (!ts.isPropertyAccessExpression(relevantNode) &&
				!ts.isElementAccessExpression(relevantNode)) {
				return false;
			}
			relevantNode = relevantNode.expression;
		}
		this.startPos = node.getStart(sourceFile);
		this.endPos = node.getEnd();
		return true;
	}

	generateChanges() {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start and end position are not defined");
		}
		if (this.params.moduleName && !this.moduleIdentifierName) {
			// The identifier for the requested module has not been set
			// This can happen for example if the position of the autofix is not inside
			// a module definition or require block. Therefore the required dependency can not be added
			// and the fix can not be applied.
			return;
		}
		if (this.params.globalName && !this.globalIdentifierName) {
			// This should not happen
			throw new Error("Global identifier has not been provided");
		}

		// If a generator function is provided, use it to generate the change
		const value = this.params.generator(this.globalIdentifierName ?? this.moduleIdentifierName);
		if (!value) {
			return;
		}
		return {
			action: ChangeAction.REPLACE,
			start: this.startPos,
			end: this.endPos,
			value,
		};
	}
}
