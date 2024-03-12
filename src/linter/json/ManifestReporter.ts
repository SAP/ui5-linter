import type {BaseReporter, ReporterMessage, ReporterCoverageInfo, PositionInfo} from "../../detectors/BaseReporter.js";
import type {LintMessage} from "../../detectors/AbstractDetector.js";
import type {jsonSourceMapType, jsonMapPointers} from "./ManifestLinter.js";
import {LintMessageSeverity, CoverageInfo} from "../../detectors/AbstractDetector.js";

export default class ManifestReporter implements BaseReporter {
	#filePath: string;
	#pointers: jsonMapPointers;
	#messages: LintMessage[] = [];
	#coverageInfo: CoverageInfo[] = [];

	constructor(filePath: string, manifest: jsonSourceMapType) {
		this.#filePath = filePath;
		this.#pointers = manifest.pointers;
	}

	addMessage({node, message, severity, ruleId, fatal = undefined}: ReporterMessage) {
		if (fatal && severity !== LintMessageSeverity.Error) {
			throw new Error(`Reports flagged as "fatal" must be of severity "Error"`);
		}

		const {line, column} = this.#getPosition((node as string));

		this.#messages.push({
			ruleId,
			severity,
			fatal,
			line,
			column,
			message,
		});
	}

	addCoverageInfo({node, message, category}: ReporterCoverageInfo) {
		const location = this.#getPositionsForNode((node as string));
		this.#coverageInfo.push({
			category,
			// One-based to be aligned with most IDEs
			line: location.key.line,
			column: location.key.column,
			endLine: location.valueEnd.line,
			endColumn: location.valueEnd.column,
			message,
		});
	}

	#getPositionsForNode(path: string) {
		const location = this.#pointers[path];

		return location || {key: 1, keyEnd: 1, value: 1, valueEnd: 1};
	}

	#getPosition(path: string): PositionInfo {
		let line = 1;
		let column = 1;

		const location = this.#pointers[path];

		if (location) {
			line = location.key.line + 1;
			column = location.key.column + 1;
		}

		return {
			line,
			column,
		};
	}

	getReport() {
		let errorCount = 0;
		let warningCount = 0;
		let fatalErrorCount = 0;
		for (const {severity, fatal} of this.#messages) {
			if (severity === LintMessageSeverity.Error) {
				errorCount++;
				if (fatal) {
					fatalErrorCount++;
				}
			} else {
				warningCount++;
			}
		}

		return {
			filePath: this.#filePath,
			messages: this.#messages,
			coverageInfo: this.#coverageInfo,
			errorCount,
			warningCount,
			fatalErrorCount,
		};
	}
}
