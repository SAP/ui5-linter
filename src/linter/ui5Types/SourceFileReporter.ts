import path from "node:path/posix";
import ts from "typescript";
import {TraceMap} from "@jridgewell/trace-mapping";
import {resolveLinks} from "../../formatter/lib/resolveLinks.js";

import LinterContext, {
	CoverageInfo,
	PositionInfo, PositionRange, ResourcePath,
	RawLintMessage,
} from "../LinterContext.js";
import {MESSAGE} from "../messages.js";
import {MessageArgs} from "../MessageArgs.js";
import {getPositionsForNode} from "../../utils/nodePosition.js";

interface ReporterCoverageInfo extends CoverageInfo {
	node: ts.Node;
}

function isTsNode<M extends MESSAGE>(node: ts.Node | MessageArgs[M] | undefined): node is ts.Node {
	return !!node && "getSourceFile" in node && typeof node.getSourceFile === "function";
}

export default class SourceFileReporter {
	#context: LinterContext;
	#resourcePath: ResourcePath;
	#originalResourcePath: ResourcePath;
	#sourceFile: ts.SourceFile | undefined;
	#traceMap: TraceMap | undefined;
	#rawMessages: RawLintMessage[] = [];
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

	addMessage<M extends MESSAGE>(id: M, args: MessageArgs[M], node: ts.Node): void;
	addMessage<M extends MESSAGE>(id: M, node: ts.Node): void;
	addMessage<M extends MESSAGE>(
		id: M, argsOrNode?: MessageArgs[M] | ts.Node, node?: ts.Node
	) {
		if (!argsOrNode) {
			throw new Error("Invalid arguments: Missing second argument");
		}
		let args: MessageArgs[M];
		if (isTsNode(argsOrNode)) {
			node = argsOrNode;
			args = null as unknown as MessageArgs[M];
		} else if (!node) {
			throw new Error("Invalid arguments: Missing 'node'");
		} else {
			args = argsOrNode;
		}

		const position: PositionInfo = {
			line: 1,
			column: 1,
		};
		if (node) {
			const {start} = this.#getPositionsForNode(node);
			// One-based to be aligned with most IDEs
			position.line = start.line;
			position.column = start.column;
			// endLine = end.line + 1;
			// endColumn = end.column + 1;
		}

		this.#rawMessages.push({id, args, position});
	}

	addCoverageInfo({node, message, messageDetails, category}: ReporterCoverageInfo) {
		const {start} = this.#getPositionsForNode(node);
		const coverageInfo: CoverageInfo = {
			category,
			// One-based to be aligned with most IDEs
			line: start.line,
			column: start.column,
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
		return getPositionsForNode({
			node,
			sourceFile: this.#sourceFile,
			traceMap: this.#traceMap,
			resourcePath: this.#resourcePath,
		});
	}

	#getOriginalResourcePath(): ResourcePath | undefined {
		if (this.#traceMap?.sources?.length && this.#traceMap.sources[0] &&
			this.#traceMap.sources[0] !== "UNKNOWN") {
			return path.join(path.dirname(this.#resourcePath), this.#traceMap.sources[0]);
		}
	}

	deduplicateMessages() {
		const lineColumnRawMessagesMap = new Map<string, RawLintMessage[]>();
		const rawMessages: RawLintMessage[] = [];
		if (this.#rawMessages.length === 0) {
			return;
		}

		for (const message of this.#rawMessages) {
			// Group messages by line/column so that we can deduplicate them
			if (!message.position?.line || !message.position?.column) {
				// If there is no line or column, we cannot group/deduplicate
				rawMessages.push(message);
				continue;
			}
			const lineColumnKey = `${message.position.line}:${message.position.column}`;
			let lineColumnMessages = lineColumnRawMessagesMap.get(lineColumnKey);
			if (!lineColumnMessages) {
				lineColumnMessages = [];
				lineColumnRawMessagesMap.set(lineColumnKey, lineColumnMessages);
			}
			lineColumnMessages.push(message);
		}

		// Add deduplicated messages to the result
		for (const lineColumnMessages of lineColumnRawMessagesMap.values()) {
			// If there are multiple messages for the same line/column,
			// and at least one of them is NOT a "no-globals-js" message,
			// we can deduplicate the "no-globals-js" messages.
			const deduplicateGlobalMessages = lineColumnMessages.length > 1 &&
				lineColumnMessages.some((message) => message.id !== MESSAGE.NO_GLOBALS);

			lineColumnMessages.forEach((message) => {
				if (deduplicateGlobalMessages && message.id === MESSAGE.NO_GLOBALS) {
					// Skip global messages if there are other messages for the same line/column
					return;
				}
				rawMessages.push(message);
			});
		}

		this.#context.addLintingMessages(this.#originalResourcePath, rawMessages);
	}
}
