import path from "path";
import ts from "typescript";
import {
	TraceMap,
	originalPositionFor,
	LEAST_UPPER_BOUND,
	GREATEST_LOWER_BOUND,
} from "@jridgewell/trace-mapping";

import {LintMessageSeverity} from "./AbstractDetector.js";
import {resolveLinks} from "../formatter/lib/resolveLinks.js";

import type {LintResult, LintMessage, CoverageInfo} from "./AbstractDetector.js";
import type {
	BaseReporter,
	ReporterMessage,
	ReporterCoverageInfo,
	PositionInfo,
	PositionRange,
} from "./BaseReporter.js";

export default class Reporter implements BaseReporter {
	#rootDir: string;
	#filePath: string;
	#sourceFile: ts.SourceFile | undefined;
	#traceMap: TraceMap | undefined;
	#messages: LintMessage[] = [];
	#coverageInfo: CoverageInfo[] = [];

	constructor(rootDir: string, filePath: string, sourceFile?: ts.SourceFile, sourceMap?: string) {
		this.#rootDir = rootDir;
		this.#filePath = filePath;
		this.#sourceFile = sourceFile;
		if (sourceMap) {
			this.#traceMap = new TraceMap(sourceMap);
		}
	}

	addMessage({node, message, messageDetails, severity, ruleId, fatal = undefined}: ReporterMessage) {
		if (fatal && severity !== LintMessageSeverity.Error) {
			throw new Error(`Reports flagged as "fatal" must be of severity "Error"`);
		}

		let line = 1, column = 1;
		if (node) {
			const {start} = this.#getPositionsForNode((node as ts.Node));
			// One-based to be aligned with most IDEs
			line = start.line + 1;
			column = start.column + 1;
			// endLine = end.line + 1;
			// endColumn = end.column + 1;
		}

		const msg: LintMessage = {
			ruleId,
			severity,
			fatal,
			line,
			column,
			message,
		};

		if (messageDetails) {
			msg.messageDetails = resolveLinks(messageDetails);
		}

		this.#messages.push(msg);
	}

	addCoverageInfo({node, message, messageDetails, category}: ReporterCoverageInfo) {
		const {start} = this.#getPositionsForNode((node as ts.Node));
		const coverageInfo: CoverageInfo = {
			category,
			// One-based to be aligned with most IDEs
			line: start.line + 1,
			column: start.column + 1,
			// endLine: end.line + 1,
			// endColumn: end.column + 1,
			message,
		};

		if (messageDetails) {
			coverageInfo.messageDetails = resolveLinks(messageDetails);
		}

		this.#coverageInfo.push(coverageInfo);
	}

	#getPositionsForNode(node: ts.Node): PositionRange {
		return {
			start: this.#getPosition(node.getStart()),
			// end: this.#getPosition(node.getEnd())
		};
	}

	#getPosition(pos: number): PositionInfo {
		if (!this.#sourceFile) {
			throw new Error(`No source file available for file ${this.#filePath}`);
		}
		// Typescript positions are all zero-based
		const {line, character: column} = this.#sourceFile.getLineAndCharacterOfPosition(pos);

		if (this.#traceMap) {
			// trace-mapping's originalPositionFor uses one-based lines and zero-based columns for input and output
			let tracedPos = originalPositionFor(this.#traceMap, {
				line: line + 1,
				column,
				bias: GREATEST_LOWER_BOUND,
			});

			if (tracedPos.line === null) {
				// No source map found at or before the given position.
				// Try again with the least upper bound (i.e. the first mapping after the given position)
				tracedPos = originalPositionFor(this.#traceMap, {
					line: line + 1,
					column,
					bias: LEAST_UPPER_BOUND,
				});
			}

			if (tracedPos.line === null) {
				throw new Error(
					`Failed to map back to source: ${this.#sourceFile.fileName} ` +
					`(line: ${line + 1}, column: ${column + 1})`);
			}
			return {
				line: tracedPos.line - 1, // Subtract 1 again to restore zero-based lines to match TypeScript output
				column: tracedPos.column,
			};
		}
		return {
			line,
			column,
		};
	}

	#getFileName(): string {
		let formattedFilePath: string = this.#filePath;
		if (this.#traceMap?.sources?.length && this.#traceMap.sources[0] &&
			this.#traceMap.sources[0] !== "UNKNOWN") {
			formattedFilePath = path.join(path.dirname(this.#filePath), this.#traceMap.sources[0]);
		}
		// re-format from absolute to relative path:
		return path.relative(this.#rootDir, formattedFilePath);
	}

	getReport(): LintResult {
		let errorCount = 0;
		let warningCount = 0;
		let fatalErrorCount = 0;
		const lineColumnMessagesMap = new Map<string, LintMessage[]>();
		const messages: LintMessage[] = [];
		for (const message of this.#messages) {
			// Group messages by line/column so that we can deduplicate them
			if (!message.line || !message.column) {
				// If there is no line or column, we cannot group/deduplicate
				messages.push(message);
				continue;
			}
			const lineColumnKey = `${message.line}:${message.column}`;
			let lineColumnMessages = lineColumnMessagesMap.get(lineColumnKey);
			if (!lineColumnMessages) {
				lineColumnMessages = [];
				lineColumnMessagesMap.set(lineColumnKey, lineColumnMessages);
			}
			lineColumnMessages.push(message);
		}

		// Add deduplicated messages to the result
		for (const lineColumnMessages of lineColumnMessagesMap.values()) {
			// If there are multiple messages for the same line/column,
			// and at least one of them is NOT a "no-globals-js" message,
			// we can deduplicate the "no-globals-js" messages.
			const deduplicateGlobalMessages = lineColumnMessages.length > 1 &&
				lineColumnMessages.some((message) => message.ruleId !== "ui5-linter-no-globals-js");

			lineColumnMessages.forEach((message) => {
				if (deduplicateGlobalMessages && message.ruleId === "ui5-linter-no-globals-js") {
					// Skip global messages if there are other messages for the same line/column
					return;
				}
				if (message.severity === LintMessageSeverity.Error) {
					errorCount++;
					if (message.fatal) {
						fatalErrorCount++;
					}
				} else {
					warningCount++;
				}
				messages.push(message);
			});
		}

		return {
			filePath: this.#getFileName(),
			messages,
			coverageInfo: this.#coverageInfo,
			errorCount,
			warningCount,
			fatalErrorCount,
		};
	}
}
