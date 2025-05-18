import ts from "typescript";
import {PositionInfo} from "../../LinterContext.js";
import {ChangeSet} from "../../../autofix/autofix.js";

export interface ModuleImportRequest {
	preferredIdentifier: string;
	position: number;
	moduleName: string;
}

export interface SourceCodeRange {
	start: number;
	end: number;
}

export class ConstrainViolation extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

export default abstract class Fix {
	/**
	 * Validate fix constrains using the transpiled AST
	 */
	abstract setInitialContext(node: ts.Node, position: PositionInfo): void;

	/**
	 * Connect the fix with the source AST (not transpiled, no types available)
	 */
	abstract setSourceFileContext(node: ts.Node, position: number, sourceFile: ts.SourceFile): void;
	abstract hasSourceFileContext(): boolean;
	abstract getModificationRanges(): SourceCodeRange | SourceCodeRange[];
	abstract setIdentifier(identifier: string, moduleName: string): void;
	abstract getChanges(): ChangeSet | ChangeSet[];
	abstract getNewModuleDependencies(): ModuleImportRequest | ModuleImportRequest[];
	// abstract getObsoleteModuleDependencies(): ModuleImportRequest | ModuleImportRequest[];
	abstract getPositionForSearch(): PositionInfo;
	abstract getNodeTypeForSearch(): ts.SyntaxKind | ts.SyntaxKind[];
}
