import type ts from "typescript";
import type {LintMessage, CoverageInfo, LintResult} from "../detectors/AbstractDetector.js";

export interface BaseReporter {
	addMessage(args: ReporterMessage): void;
	addCoverageInfo(args: ReporterCoverageInfo): void;
	getReport(): LintResult;
}

export interface ReporterMessage {
	node?: ts.Node | string;
	message: LintMessage["message"];
	messageDetails?: LintMessage["messageDetails"];
	severity: LintMessage["severity"];
	ruleId: LintMessage["ruleId"];
	fatal?: LintMessage["fatal"];
}

export interface PositionInfo {
	line: number;
	column: number;
}

export interface PositionRange {
	start: PositionInfo;
	end?: PositionInfo;
}

export interface ReporterCoverageInfo {
	node: ts.Node | string;
	message: CoverageInfo["message"];
	messageDetails?: CoverageInfo["messageDetails"];
	category: CoverageInfo["category"];
}
