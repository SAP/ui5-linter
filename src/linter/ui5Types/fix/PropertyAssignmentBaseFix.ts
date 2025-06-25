import ts from "typescript";
import {ChangeSet} from "../../../autofix/autofix.js";
import {PositionInfo} from "../../LinterContext.js";
import {Attribute, Position, SaxEventType} from "sax-wasm";
import XmlEnabledFix from "./XmlEnabledFix.js";
import {FixHelpers} from "./Fix.js";

/**
 * Fix a global property access. Requires a module name which will be imported and replaces the defined property access.
 * The property access is in the order of the AST, e.g. ["core", "ui", "sap"]
 */
export default abstract class PropertyAssignmentBaseFix extends XmlEnabledFix {
	protected sourcePosition: PositionInfo | undefined;
	protected startPos: number | undefined;
	protected endPos: number | undefined;

	constructor() {
		super();
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo, _helpers: FixHelpers) {
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

	visitAutofixNode(node: ts.Node, _position: number, _sourceFile: ts.SourceFile) {
		if (!ts.isPropertyAssignment(node)) {
			return false;
		}
		this.startPos = node.getStart();
		this.endPos = node.getEnd();
		return true;
	}

	visitAutofixXmlNode(node: Attribute, toPosition: (pos: Position) => number) {
		this.startPos = toPosition(node.name.start);
		this.endPos = toPosition(node.value.end) + 1; // TODO: +1 might be incorrect if no quotes are used
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

	generateChanges(): ChangeSet | ChangeSet[] | undefined {
		throw new Error("Method 'generateChanges' must be implemented in subclasses");
	}
}
