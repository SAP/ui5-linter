import ts from "typescript";
import {ChangeSet} from "../../../autofix/autofix.js";
import {PositionInfo} from "../../LinterContext.js";

export default abstract class Fix {
	abstract getSolution(): ChangeSet[];
	// abstract getSolutions(solutionGenerator: SolutionGenerator): ChangeSet[];
	abstract getStartPosition(): PositionInfo | undefined;
	abstract getNodeType(): ts.SyntaxKind;
	abstract getNodePropertyAccess(): string;
}
