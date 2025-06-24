import ts from "typescript";
import {ChangeAction, ChangeSet} from "../../../autofix/autofix.js";
import {PositionInfo} from "../../LinterContext.js";
import {Attribute, Position, SaxEventType} from "sax-wasm";
import XmlEnabledFix from "./XmlEnabledFix.js";

export interface PropertyAssignmentFixParams {
	/**
	 * Property name to replace the property access with.
	 * If not defined, the complete property assignment will be removed.
	 */
	property?: string;
};

/**
 * Fix a global property access. Requires a module name which will be imported and replaces the defined property access.
 * The property access is in the order of the AST, e.g. ["core", "ui", "sap"]
 */
export default class PropertyAssignmentFix extends XmlEnabledFix {
	private sourcePosition: PositionInfo | undefined;
	private startPos: number | undefined;
	private endPos: number | undefined;

	constructor(private params: PropertyAssignmentFixParams) {
		super();
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo) {
		if (!ts.isPropertyAssignment(node) || (!ts.isIdentifier(node.name) && !ts.isStringLiteralLike(node.name))) {
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
			xmlEventTypes: [SaxEventType.Attribute],
			position: this.sourcePosition,
		};
	}

	visitAutofixNode(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!ts.isPropertyAssignment(node)) {
			return false;
		}
		if (this.params.property) {
			// Only replace the property name, not the whole assignment
			node = node.name;
		}
		this.startPos = node.getStart(sourceFile);
		this.endPos = node.getEnd();
		return true;
	}

	visitAutofixXmlNode(node: Attribute, toPosition: (pos: Position) => number) {
		this.startPos = toPosition(node.name.start);
		if (this.params.property) {
			// Only replace the property name, not the whole assignment
			this.endPos = toPosition(node.name.end);
		} else {
			// Replace the whole assignment
			this.endPos = toPosition(node.value.end) + 1; // TODO: +1 might be incorrect if no quotes are used
		}
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

	generateChanges(): ChangeSet {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start and end position are not defined");
		}
		if (this.params.property) {
			return {
				action: ChangeAction.REPLACE,
				start: this.startPos,
				end: this.endPos,
				value: this.params.property,
			};
		} else {
			return {
				action: ChangeAction.DELETE,
				start: this.startPos,
				end: this.endPos,
			};
		}
	}
}
