import ts from "typescript";
import {ChangeAction} from "../../../autofix/autofix.js";
import {PositionInfo} from "../../LinterContext.js";
import Fix from "./Fix.js";

export interface PropertyAssignmentFixParams {
	property: string;
};

/**
 * Fix a global property access. Requires a module name which will be imported and replaces the defined property access.
 * The property access is in the order of the AST, e.g. ["core", "ui", "sap"]
 */
export default class PropertyAssignmentFix extends Fix {
	private sourcePosition: PositionInfo | undefined;
	private startPos: number | undefined;
	private endPos: number | undefined;

	constructor(private params: PropertyAssignmentFixParams) {
		super();
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo) {
		if (!ts.isPropertyAssignment(node) || !ts.isIdentifier(node.name)) {
			return false;
		}

		this.sourcePosition = sourcePosition;
		return true;
	}

	getNodeSearchParameters() {
		if (this.sourcePosition === undefined) {
			throw new Error("Position for search is not defined");
		}
		return {
			nodeTypes: [ts.SyntaxKind.PropertyAssignment],
			position: this.sourcePosition,
		};
	}

	visitAutofixNode(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!ts.isPropertyAssignment(node)) {
			return false;
		}
		const identifier = node.name;
		this.startPos = identifier.getStart(sourceFile);
		this.endPos = identifier.getEnd();
		return true;
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

	getNewModuleDependencies() {
		return undefined;
	}

	setIdentifierForDependency() {
		return;
	}

	getNewGlobalAccess() {
		return undefined;
	}

	setIdentifierForGlobal() {
		return;
	}

	generateChanges() {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start and end position are not defined");
		}
		return {
			action: ChangeAction.REPLACE,
			start: this.startPos,
			end: this.endPos,
			value: this.params.property,
		};
	}
}
