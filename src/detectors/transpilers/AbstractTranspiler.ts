import {LintMessage} from "../AbstractDetector.js";

export interface TranspileResult {
	source: string;
	map: string;
	messages?: LintMessage[];
}
