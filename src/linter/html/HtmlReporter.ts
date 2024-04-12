import {Tag as SaxTag} from "sax-wasm";
import LinterContext, {CoverageInfo, LintMessage, LintMessageSeverity, ResourcePath} from "../LinterContext.js";
import {resolveLinks} from "../../formatter/lib/resolveLinks.js";

interface ReporterMessage extends LintMessage {
	node: SaxTag;
}

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

	addMessage({node, message, messageDetails, severity, ruleId, fatal = undefined}: ReporterMessage) {
		if (fatal && severity !== LintMessageSeverity.Error) {
			throw new Error(`Reports flagged as "fatal" must be of severity "Error"`);
		}

		let line = 0, column = 0;
		if (node instanceof SaxTag) {
			({line, character: column} = node.openStart);
		}

		this.#context.addLintingMessage(this.#resourcePath, {
			ruleId,
			severity,
			fatal,
			line: line + 1,
			column: column + 1,
			message,
			messageDetails: messageDetails ? resolveLinks(messageDetails) : undefined,
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
