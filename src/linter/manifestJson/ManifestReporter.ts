import type {jsonSourceMapType, jsonMapPointers} from "./ManifestLinter.js";
import LinterContext, {
	FilePath, LintMessage, LintMessageSeverity, CoverageInfo, PositionInfo,
} from "../LinterContext.js";

interface ReporterMessage extends LintMessage {
	node: string;
}

interface ReporterCoverageInfo extends CoverageInfo {
	node: string;
}

export default class ManifestReporter {
	#filePath: string;
	#pointers: jsonMapPointers;
	#context: LinterContext;

	constructor(filePath: FilePath, context: LinterContext, manifest: jsonSourceMapType) {
		this.#filePath = filePath;
		this.#pointers = manifest.pointers;
		this.#context = context;
	}

	addMessage({node, message, severity, ruleId, fatal = undefined}: ReporterMessage) {
		if (fatal && severity !== LintMessageSeverity.Error) {
			throw new Error(`Reports flagged as "fatal" must be of severity "Error"`);
		}

		const {line, column} = this.#getPosition(node);

		this.#context.addLintingMessage(this.#filePath, {
			ruleId,
			severity,
			fatal,
			line,
			column,
			message,
		});
	}

	addCoverageInfo({node, message, category}: ReporterCoverageInfo) {
		const location = this.#getPositionsForNode(node);
		this.#context.addCoverageInfo(this.#filePath, {
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
}
