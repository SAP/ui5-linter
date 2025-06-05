import ts from "typescript";
import {ChangeAction} from "../../../autofix/autofix.js";
import {PositionInfo} from "../../LinterContext.js";
import Fix from "./Fix.js";

export interface GlobalFixParams {
	moduleName: string;
	propertyAccessStack: string[];
};

/**
 * Fix a global property access. Requires a module name which will be imported and replaces the defined property access.
 * The property access is in the order of the AST, e.g. ["core", "ui", "sap"]
 */
export default class GlobalFix extends Fix {
	private startPos: number | undefined;
	private endPos: number | undefined;
	private identifier: string | undefined;
	private sourcePosition: PositionInfo | undefined;

	constructor(private params: GlobalFixParams) {
		super();
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo) {
		if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node) && !ts.isCallExpression(node)) {
			return false;
		}
		// TODO: Add checks for delete expression and conditional access here
		this.sourcePosition = sourcePosition;
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
		const firstPart = this.params.propertyAccessStack[0];
		// Check whether first part matches, that's all we need for start and end positions
		if ((ts.isPropertyAccessExpression(node) && node.name.text === firstPart) ||
			(ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression) &&
				node.argumentExpression.text === firstPart)) {
			this.startPos = node.getStart(sourceFile);
			this.endPos = node.getEnd();
			return true;
		}
		return false;
	}

	getAffectedSourceCodeRange() {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start and end position are not defined");
		}
		return {
			start: this.startPos,
			end: this.endPos,
		};
	}

	setIdentifierForDependency(identifier: string) {
		this.identifier = identifier;
	}

	getNewModuleDependencies() {
		if (this.startPos === undefined) {
			throw new Error("Start position is not defined");
		}
		if (!this.params.moduleName) {
			return;
		}
		return {
			moduleName: this.params.moduleName,
			usagePosition: this.startPos,
		};
	}

	generateChanges() {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start and end position are not defined");
		}
		if (!this.identifier) {
			// Identifier has not been set. This can happen if the relevant position is not inside a
			// module definition or require block. Therefore the fix can not be applied.
			return;
		}
		let value = this.identifier;
		return {
			action: ChangeAction.REPLACE,
			start: this.startPos,
			end: this.endPos,
			value,
		};
	}
}
