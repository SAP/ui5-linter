import ts from "typescript";
import {ChangeAction} from "../../../autofix/autofix.js";
import {PositionInfo} from "../../LinterContext.js";
import {countChildNodesRecursive, isExpectedValueExpression} from "../utils/utils.js";
import BaseFix, {BaseFixParams, FixScope} from "./BaseFix.js";

export interface CallExpressionFixParams extends BaseFixParams {
	/**
	 * Validation: If set to true, the fix will only be applied if the return value of the code does not use the
	 * return value of the call expression.
	 */
	mustNotUseReturnValue?: boolean;
	/**
	 * Which scope, i.e. number of access expressions (counting from the call expression) should the replacement
	 * affect.
	 *
	 * Examples for the code "sap.module.method()":
	 * - "scope = 0" will replace the whole "sap.module.method()"
	 * - "scope = 1" will replace "sap.module.method"
	 * - "scope = 2" will replace "sap.module"
	 *
	 * If not set, the default value is 1.
	 */
	scope?: number | FixScope;
	/**
	 * Whether to add a "new" keyword before the expression
	 */
	newExpression?: boolean;
}

export default class CallExpressionFix extends BaseFix {
	protected nodeTypes = [ts.SyntaxKind.CallExpression];
	protected containedCallExpressionCount = 0;

	constructor(protected params: CallExpressionFixParams) {
		super(params);
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo, _checker: ts.TypeChecker) {
		if (!ts.isCallExpression(node)) {
			return false;
		}
		// If requested, check whether the return value of the call expression is assigned to a variable,
		// passed to another function or used elsewhere.
		if (this.params.mustNotUseReturnValue && isExpectedValueExpression(node)) {
			return false;
		}
		this.sourcePosition = sourcePosition;
		this.containedCallExpressionCount = countChildNodesRecursive(node, this.nodeTypes);
		return true;
	}

	visitAutofixNode(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!ts.isCallExpression(node)) {
			return false;
		}

		const count = countChildNodesRecursive(node, this.nodeTypes);
		if (count !== this.containedCallExpressionCount) {
			// The number of access expressions does not match the expected count
			// Reject this node and wait for it's child
			return false;
		}

		let relevantNode: ts.AccessExpression | ts.CallExpression = node;
		for (let i = 0; i < (this.params.scope ?? 1); i++) {
			if (!ts.isPropertyAccessExpression(relevantNode.expression) &&
				!ts.isElementAccessExpression(relevantNode.expression)) {
				return false;
			}
			relevantNode = relevantNode.expression;
		}

		this.startPos = relevantNode.getStart(sourceFile);
		this.endPos = relevantNode.getEnd();
		return true;
	}

	generateChanges() {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start or end position is not defined");
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

		let value = this.globalIdentifierName ?? this.moduleIdentifierName;
		if (!value) {
			return;
		}

		if (this.params.propertyAccess) {
			// If a property is defined, we need to access it on the identifier
			value = `${value}.${this.params.propertyAccess}`;
		}
		if (this.params.newExpression) {
			// If the newExpression flag is set, we need to add a "new" keyword before the expression
			value = `new ${value}`;
		}
		return {
			action: ChangeAction.REPLACE,
			start: this.startPos,
			end: this.endPos,
			value,
		};
	}
}
