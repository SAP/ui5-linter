import {LintMessageSeverity} from "../LinterContext.js";
import LinterContext from "../LinterContext.js";
import deprecatedLibraries from "../../utils/deprecatedLibs.js";
import yaml from "js-yaml";
import {DataWithPosition, fromYaml, getPosition} from "data-with-position";

// file content schema of 'UI5Yaml' with only relevant properties
interface UI5YamlContentSchema { // extend for further detections
	framework: {
		libraries: {
			name: string;
		}[];
	};
}

interface UI5YamlContentSchemaWithPosInfo extends DataWithPosition {
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

export default class UI5YamlLinter {
	#content = "";
	#yamlContentWithPosInfo: UI5YamlContentSchemaWithPosInfo = {};
	#resourcePath = "";
	#context: LinterContext;

	constructor(resourcePath: string, content: string, context: LinterContext) {
		this.#content = content;
		this.#resourcePath = resourcePath;
		this.#context = context;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async lint() {
		try {
			const source: UI5YamlContentSchema = this.#parseUI5Yaml(this.#content);
			this.#analyzeUI5Yaml(source);
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

	#parseUI5Yaml(fileContent: string): UI5YamlContentSchema {
		// Create JS object from YAML content with position information
		this.#yamlContentWithPosInfo = fromYaml(fileContent) as UI5YamlContentSchemaWithPosInfo;
		// Convert YAML content to JS object
		return yaml.load(fileContent) as UI5YamlContentSchema;
	}

	#analyzeUI5Yaml(ui5YamlObject: UI5YamlContentSchema) {
		// Check for deprecated libraries
		if (ui5YamlObject?.framework?.libraries?.length) {
			ui5YamlObject.framework.libraries.forEach((lib, index: number) => {
				if (deprecatedLibraries.includes(lib.name)) {
					const positionInfo = getPosition(this.#yamlContentWithPosInfo.framework!.libraries![index]);
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
}
