import path from "node:path/posix";
import ts from "typescript";
import {
	TraceMap,
	originalPositionFor,
	LEAST_UPPER_BOUND,
	GREATEST_LOWER_BOUND,
} from "@jridgewell/trace-mapping";
import {resolveLinks} from "../../formatter/lib/resolveLinks.js";

import LinterContext, {
	LintMessage, CoverageInfo, LintMessageSeverity,
	PositionInfo, PositionRange, ResourcePath,
} from "../LinterContext.js";

interface ReporterMessage extends LintMessage {
	node: ts.Node;
}

interface ReporterCoverageInfo extends CoverageInfo {
	node: ts.Node;
}

export default class SourceFileReporter {
	#context: LinterContext;
	#resourcePath: ResourcePath;
	#originalResourcePath: ResourcePath;
	#sourceFile: ts.SourceFile | undefined;
	#traceMap: TraceMap | undefined;
	#messages: LintMessage[] = [];
	#coverageInfo: CoverageInfo[] = [];

	constructor(
		context: LinterContext, resourcePath: ResourcePath,
		sourceFile: ts.SourceFile, sourceMap: string | undefined
	) {
		this.#context = context;
		this.#resourcePath = resourcePath;
		this.#sourceFile = sourceFile;
		if (sourceMap) {
			this.#traceMap = new TraceMap(sourceMap);
		}

		this.#originalResourcePath = this.#getOriginalResourcePath() ?? resourcePath;
		// Do not use messages from context yet, to allow local de-duplication
		this.#coverageInfo = context.getCoverageInfo(this.#originalResourcePath);
	}

	addMessage({node, message, messageDetails, severity, ruleId, fatal = undefined}: ReporterMessage) {
		if (fatal && severity !== LintMessageSeverity.Error) {
			throw new Error(`Reports flagged as "fatal" must be of severity "Error"`);
		}

		let line = 1, column = 1;
		if (node) {
			const {start} = this.#getPositionsForNode(node);
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
		const {start} = this.#getPositionsForNode(node);
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
			throw new Error(`No source file available for file ${this.#resourcePath}`);
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

	#getOriginalResourcePath(): ResourcePath | undefined {
		if (this.#traceMap?.sources?.length && this.#traceMap.sources[0] &&
			this.#traceMap.sources[0] !== "UNKNOWN") {
			return path.join(path.dirname(this.#resourcePath), this.#traceMap.sources[0]);
		}
	}

	deduplicateMessages() {
		const lineColumnMessagesMap = new Map<string, LintMessage[]>();
		const messages: LintMessage[] = [];
		if (this.#messages.length === 0) {
			return;
		}

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
				messages.push(message);
			});
		}

		this.#context.getLintingMessages(this.#originalResourcePath).push(...messages);
	}
}
