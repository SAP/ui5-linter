import ts from "typescript";
import Fix from "./Fix.js";
import {ChangeSet} from "../../../autofix/autofix.js";
import {PositionInfo} from "../../LinterContext.js";

export default class FixJquerySapLog extends Fix {
	private nodeKind: ts.SyntaxKind;
	private propertyAccess: string;
	private startPosition: PositionInfo;

	constructor(node: ts.Node) {
		super();
		this.nodeKind = node.kind;
		this.propertyAccess = "";
	}

	getSolution(): ChangeSet[] {
		throw new Error("Method not implemented.");
	}

	getStartPosition(): PositionInfo | undefined {

	}

	getNodeType(): ts.SyntaxKind {
		return this.nodeKind;
	}

	getNodePropertyAccess(): string {
		return this.propertyAccess;
	}

	static create(node: ts.Node): FixJquerySapLog | undefined {
		if (!ts.isCallExpression(node)) {
			// Only call expressions can be fixed as we need to check whether
			// the return value is used
			return undefined;
		}
		return new FixJquerySapLog(node);
	}
}
