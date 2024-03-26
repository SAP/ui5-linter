import type {BaseReporter, ReporterMessage, ReporterCoverageInfo} from "../../detectors/BaseReporter.js";
import type {LintMessage} from "../../detectors/AbstractDetector.js";
import {Tag as SaxTag} from "sax-wasm";
import {LintMessageSeverity, CoverageInfo} from "../../detectors/AbstractDetector.js";
import {resolveLinks} from "../../formatter/lib/resolveLinks.js";

export default class HtmlReporter implements BaseReporter {
	#filePath: string;
	#messages: LintMessage[] = [];
	#coverageInfo: CoverageInfo[] = [];

	constructor(filePath: string) {
		this.#filePath = filePath;
	}

	addMessage({node, message, messageDetails, severity, ruleId, fatal = undefined}: ReporterMessage) {
		if (fatal && severity !== LintMessageSeverity.Error) {
			throw new Error(`Reports flagged as "fatal" must be of severity "Error"`);
		}

		let line = 1, column = 1;
		if (node instanceof SaxTag) {
			({line, character: column} = node.openStart);
		}

		const msg: LintMessage = {
			ruleId,
			severity,
			fatal,
			line: line + 1,
			column: column + 1,
			message,
		};

		if (messageDetails) {
			msg.messageDetails = resolveLinks(messageDetails);
		}

		this.#messages.push(msg);
	}

	addCoverageInfo({node, message, category}: ReporterCoverageInfo) {
		let line = 1, column = 1, endLine = 1, endColumn = 1;
		if (node instanceof SaxTag) {
			({line, character: column} = node.openStart);
			({line: endLine, character: endColumn} = node.closeEnd);
		}

		this.#coverageInfo.push({
			category,
			// One-based to be aligned with most IDEs
			line: line + 1,
			column: column + 1,
			endLine: endLine + 1,
			endColumn: endColumn + 1,
			message,
		});
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
