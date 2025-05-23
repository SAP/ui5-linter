import ts from "typescript";
import {ModuleImportRequest as ModuleDependencyRequest, ConstrainViolation} from "../Fix.js";
import {ChangeAction, ChangeSet} from "../../../../autofix/autofix.js";
import {PositionInfo} from "../../../LinterContext.js";
import TemplateBasedFix, {FixTemplate, TEMPLATE_ID} from "../TemplateBasedFix.js";
import {isExpectedValueExpression} from "../../utils/utils.js";

export interface CallExpressionFixTemplate extends FixTemplate {
	id: TEMPLATE_ID.CALL_EXPRESSION;
	moduleName: string;
	preferredIdentifier: string;
	mustNotUseReturnValue?: boolean;
}

export default class CallExpressionFix extends TemplateBasedFix {
	// private relevantAccessNode: ts.PropertyAccessExpression | undefined;
	private startPos: number | undefined;
	private endPos: number | undefined;
	private identifier: string | undefined;
	private positionForSearch: PositionInfo | undefined;

	constructor(private template: CallExpressionFixTemplate) {
		super(template);
	}

	getNodeTypeForSearch(): ts.SyntaxKind {
		return ts.SyntaxKind.CallExpression;
	}

	setInitialContext(node: ts.Node, position: PositionInfo) {
		if (!ts.isCallExpression(node)) {
			throw new Error(`Unexpected node: Fix requires a CallExpression node but got ${ts.SyntaxKind[node.kind]}`);
		}
		// If requested, check whether the return value of the call expression is assigned to a variable,
		// passed to another function or used elsewhere.
		if (this.template.mustNotUseReturnValue && isExpectedValueExpression(node)) {
			throw new ConstrainViolation(`${this.template.moduleName} fix is not compatible ` +
				`because the return value of the call expression is being used`);
		}

		this.positionForSearch = position;
	}

	setSourceFileContext(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!ts.isCallExpression(node)) {
			throw new Error(`Unexpected node: Fix requires a CallExpression node but got ${ts.SyntaxKind[node.kind]}`);
		}
		if (!ts.isPropertyAccessExpression(node.expression)) {
			return;
		}
		const relevantAccessNode = node.expression;
		if (!ts.isPropertyAccessExpression(relevantAccessNode)) {
			return;
		}

		// this.relevantAccessNode = relevantAccessNode;
		this.startPos = relevantAccessNode.getStart(sourceFile);
		this.endPos = relevantAccessNode.getEnd();
	}

	hasSourceFileContext() {
		return this.startPos !== undefined;
	}

	getPositionForSearch() {
		if (this.positionForSearch === undefined) {
			throw new Error("Position for search is not defined");
		}
		return this.positionForSearch;
	}

	getModificationRanges() {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start and end position are not defined");
		}
		return {
			start: this.startPos,
			end: this.endPos,
		};
	}

	setIdentifier(identifier: string) {
		this.identifier = identifier;
	}

	getNewModuleDependencies(): ModuleDependencyRequest | ModuleDependencyRequest[] {
		if (this.startPos === undefined) {
			throw new Error("Start position is not defined");
		}
		return {
			moduleName: this.template.moduleName,
			preferredIdentifier: this.template.preferredIdentifier,
			position: this.startPos,
		};
	}

	getChanges(): ChangeSet | ChangeSet[] {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start and end position are not defined");
		}
		if (!this.identifier) {
			throw new Error("Log identifier is not defined");
		}
		return {
			action: ChangeAction.REPLACE,
			start: this.startPos,
			end: this.endPos,
			value: this.identifier,
		};
	}
}
