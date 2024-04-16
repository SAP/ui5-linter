import {LintMessageSeverity} from "../LinterContext.js";
import LinterContext from "../LinterContext.js";
import deprecatedLibraries from "../../utils/deprecatedLibs.js";
import {DataWithPosition, fromYaml, getPosition} from "data-with-position";

interface YamlContent extends DataWithPosition {
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
			// TODO: Support multiple documents in one Yaml file
			// https://sap.github.io/ui5-tooling/stable/pages/extensibility/CustomTasks/#example-custom-task-extension-defined-in-ui5-project
			// How: Loop through this.#content for each line
			// Check if line matches yamlDocumentSeparator ('---')
			// Use index of line as offset
			// Call analyzeYaml() and Pass offset

			// const yamlDocumentLines = this.#content.split(/\r?\n|\r|\n/g); // End of line regex
			this.#content.split("---").forEach((partDocument) => {
				// TODO: Calculate offset + Pass to analyzeYaml()
				const source: YamlContent = this.#parseYaml(partDocument);
				this.#analyzeYaml(source);
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.#context.addLintingMessage(this.#resourcePath, {
				severity: LintMessageSeverity.Error,
				message,
				ruleId: "ui5-linter-parsing-error",
				fatal: true,
			});
		}
	}

	#parseYaml(fileContent: string): YamlContent {
		// Create JS object from YAML content with position information
		return fromYaml(fileContent) as YamlContent;
	}

	#analyzeYaml(yamlObject: YamlContent) {
		// Check for deprecated libraries
		yamlObject?.framework?.libraries?.forEach((lib) => {
			if (deprecatedLibraries.includes(lib.name.toString())) {
				const positionInfo = getPosition(lib);
				// TODO: Add offset to line property (addition)
				this.#context.addLintingMessage(this.#resourcePath, {
					ruleId: "ui5-linter-no-deprecated-api",
					severity: LintMessageSeverity.Error,
					fatal: undefined,
					line: positionInfo.start.line,
					column: positionInfo.start.column,
					message: `Use of deprecated library '${lib.name}'`,
				});
			}
		});
	}
}
