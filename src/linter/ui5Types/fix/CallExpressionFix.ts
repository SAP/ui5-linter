import ts from "typescript";
import {ChangeAction} from "../../../autofix/autofix.js";
import {PositionInfo} from "../../LinterContext.js";
import CallExpressionBaseFix, {CallExpressionBaseFixParams} from "./CallExpressionBaseFix.js";
import {FixScope} from "./BaseFix.js";

export interface CallExpressionFixParams extends CallExpressionBaseFixParams {
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

export default class CallExpressionFix extends CallExpressionBaseFix {
	constructor(protected params: CallExpressionFixParams) {
		super(params);
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo, checker: ts.TypeChecker) {
		return super.visitLinterNode(node, sourcePosition, checker);
	}

	visitAutofixNode(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!super.visitAutofixNode(node, position, sourceFile)) {
			return false;
		}
		if (!ts.isCallExpression(node)) {
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

		const identifier = this.getIdentifiersForSingleRequest(this.params.moduleName, this.params.globalName);
		if (!identifier) {
			return;
		}

		let value = identifier;
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
