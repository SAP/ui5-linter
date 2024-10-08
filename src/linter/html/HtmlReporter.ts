import {Tag as SaxTag, Text as SaxText, Position as SaxPosition} from "sax-wasm";
import LinterContext, {CoverageInfo, ResourcePath} from "../LinterContext.js";
import {MESSAGE} from "../messages.js";
import {MessageArgs} from "../MessageArgs.js";

interface ReporterCoverageInfo extends CoverageInfo {
	node: SaxTag;
}

export default class HtmlReporter {
	#resourcePath: string;
	#context: LinterContext;

	constructor(resourcePath: ResourcePath, context: LinterContext) {
		this.#resourcePath = resourcePath;
		this.#context = context;
	}

	addMessage<M extends MESSAGE>(id: M, args: MessageArgs[M], node: SaxTag | SaxText): void;
	addMessage<M extends MESSAGE>(id: M, node: SaxTag | SaxText): void;
	addMessage<M extends MESSAGE>(
		id: M, argsOrNode?: MessageArgs[M] | SaxTag | SaxText, node?: SaxTag | SaxText
	) {
		if (!argsOrNode) {
			throw new Error("Invalid arguments: Missing second argument");
		}
		let args: MessageArgs[M];
		if (argsOrNode instanceof SaxTag) {
			node = argsOrNode;
			args = null as unknown as MessageArgs[M];
		} else if (argsOrNode instanceof SaxText) {
			node = argsOrNode;
			args = null as unknown as MessageArgs[M];
		} else if (!node) {
			throw new Error("Invalid arguments: Missing 'node'");
		} else {
			args = argsOrNode;
		}

		let startPos: SaxPosition;
		if (node instanceof SaxTag) {
			startPos = node.openStart;
		} else {
			startPos = node.start;
		}
		this.#context.addLintingMessage(this.#resourcePath, id, args, {
			line: startPos.line + 1,
			column: startPos.character + 1,
		});
	}

	addCoverageInfo({node, message, category}: ReporterCoverageInfo) {
		let line = 0, column = 0, endLine = 0, endColumn = 0;
		if (node instanceof SaxTag) {
			({line, character: column} = node.openStart);
			({line: endLine, character: endColumn} = node.closeEnd);
		}

		this.#context.addCoverageInfo(this.#resourcePath, {
			category,
			// One-based to be aligned with most IDEs
			line: line + 1,
			column: column + 1,
			endLine: endLine + 1,
			endColumn: endColumn + 1,
			message,
		});
	}
}
