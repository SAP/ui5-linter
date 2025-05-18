import ts from "typescript";
import {ModuleImportRequest as ModuleDependencyRequest} from "../Fix.js";
import {ChangeAction, ChangeSet} from "../../../../autofix/autofix.js";
import {PositionInfo} from "../../../LinterContext.js";
import TemplateBasedFix, {FixTemplate, TEMPLATE_ID} from "../TemplateBasedFix.js";

export interface AccessExpressionFixTemplate extends FixTemplate {
	id: TEMPLATE_ID.ACCESS_EXPRESSION;
	moduleName: string;
	preferredIdentifier: string;
	mustNotUseReturnValue?: boolean;
}

export default class AccessExpressionFix extends TemplateBasedFix {
	private startPos: number | undefined;
	private endPos: number | undefined;
	private identifier: string | undefined;
	private positionForSearch: PositionInfo | undefined;

	constructor(private template: AccessExpressionFixTemplate) {
		super(template);
	}

	setInitialContext(node: ts.Node, position: PositionInfo) {
		if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) {
			throw new Error(
				`Unexpected node: Fix requires an AccessExpression node but got ${ts.SyntaxKind[node.kind]}`);
		}
		this.positionForSearch = position;
	}

	setSourceFileContext(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) {
			throw new Error(
				`Unexpected node: Fix requires an AccessExpression node but got ${ts.SyntaxKind[node.kind]}`);
		}
		this.startPos = node.getStart(sourceFile);
		this.endPos = node.getEnd();
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

	getNodeTypeForSearch(): ts.SyntaxKind | ts.SyntaxKind[] {
		return [ts.SyntaxKind.PropertyAccessExpression, ts.SyntaxKind.ElementAccessExpression];
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
