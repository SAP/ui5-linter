import {LintMessageSeverity} from "../LinterContext.js";
import LinterContext from "../LinterContext.js";
import {deprecatedLibraries, deprecatedThemeLibraries} from "../../utils/deprecations.js";
import {DataWithPosition, fromYaml, getPosition} from "data-with-position";
import {RULES, MESSAGES, formatMessage} from "../linterReporting.js";

interface YamlWithPosInfo extends DataWithPosition {
	framework?: {
		libraries?: {
			name: string;
		}[];
	};
	positionKey?: {
		end: {
			column: number;
			line: number;
		};
		start: {
			column: number;
			line: number;
		};
	};
}

export default class YamlLinter {
	#content;
	#resourcePath;
	#context: LinterContext;

	constructor(resourcePath: string, content: string, context: LinterContext) {
		this.#content = content;
		this.#resourcePath = resourcePath;
		this.#context = context;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async lint() {
		try {
			// Split Yaml file into part documents by '---' separator
			const allDocuments: string[] = this.#content.split(/(?:\r\n|\r|\n)---/g);

			// Calculate the starting line number of each part document
			let lineNumberOffset = 0;
			allDocuments.forEach((document: string) => {
				// Parse content only of the current part
				const parsedYamlWithPosInfo: YamlWithPosInfo = this.#parseYaml(document);
				// Analyze part content with line number offset
				this.#analyzeYaml(parsedYamlWithPosInfo, lineNumberOffset);
				// Update line number offset for next part
				lineNumberOffset += document.split(/\r\n|\r|\n/g).length;
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.#context.addLintingMessage(this.#resourcePath, {
				severity: LintMessageSeverity.Error,
				message,
				ruleId: RULES["ui5-linter-parsing-error"],
				fatal: true,
			});
		}
	}

	#parseYaml(content: string): YamlWithPosInfo {
		// Create JS object from YAML content with position information
		return fromYaml(content) as YamlWithPosInfo;
	}

	#analyzeYaml(yaml: YamlWithPosInfo, offset: number) {
		// Check for deprecated libraries
		yaml?.framework?.libraries?.forEach((lib) => {
			const libraryName = lib.name.toString();
			if (deprecatedLibraries.includes(libraryName) || deprecatedThemeLibraries.includes(libraryName)) {
				const positionInfo = getPosition(lib);
				this.#context.addLintingMessage(this.#resourcePath, {
					ruleId: RULES["ui5-linter-no-deprecated-api"],
					severity: LintMessageSeverity.Error,
					fatal: undefined,
					line: positionInfo.start.line + offset,
					column: positionInfo.start.column,
					message: formatMessage(MESSAGES.SHORT__DEPRECATED_LIBRARY, libraryName),
				});
			}
		});
	}
}
