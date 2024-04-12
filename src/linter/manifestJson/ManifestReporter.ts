import type {jsonSourceMapType, jsonMapPointers} from "./ManifestLinter.js";
import LinterContext, {
	LintMessage, LintMessageSeverity, CoverageInfo, PositionInfo, ResourcePath,
} from "../LinterContext.js";

interface ReporterMessage extends LintMessage {
	node: string;
}

interface ReporterCoverageInfo extends CoverageInfo {
	node: string;
}

export default class ManifestReporter {
	#resourcePath: ResourcePath;
	#pointers: jsonMapPointers;
	#context: LinterContext;

	constructor(resourcePath: ResourcePath, context: LinterContext, manifest: jsonSourceMapType) {
		this.#resourcePath = resourcePath;
		this.#pointers = manifest.pointers;
		this.#context = context;
	}

	addMessage({node, message, severity, ruleId, fatal = undefined}: ReporterMessage) {
		if (fatal && severity !== LintMessageSeverity.Error) {
			throw new Error(`Reports flagged as "fatal" must be of severity "Error"`);
		}

		const {line, column} = this.#getPosition(node);

		this.#context.addLintingMessage(this.#resourcePath, {
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
		this.#context.addCoverageInfo(this.#resourcePath, {
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
