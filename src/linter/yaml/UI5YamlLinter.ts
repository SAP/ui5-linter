import type {LintResult} from "../../detectors/AbstractDetector.js";
import type {LintMessage} from "../../detectors/AbstractDetector.js";
import {LintMessageSeverity, CoverageInfo} from "../../detectors/AbstractDetector.js";
import yaml from "js-yaml";
import {DataWithPosition, fromYaml, getPosition} from "data-with-position";

const deprecatedLibraries: string[] = [ // TODO: outsource as constant (for reuse in ManifestLinter.ts)
	"sap.ca.scfld.md",
	"sap.ca.ui",
	"sap.fe.common", // Internal, removed in 1.110
	"sap.fe.plugins", // Internal, removed in 1.102
	"sap.fe.semantics", // Internal, removed in 1.104
	"sap.landvisz", // Removed in 1.120
	"sap.makit",
	"sap.me",
	"sap.sac.grid", // Removed in 1.114
	"sap.ui.commons",
	"sap.ui.suite",
	"sap.ui.ux3",
	"sap.ui.vtm",
	"sap.uiext.inbox",
	"sap.webanalytics.core",
	"sap.zen.commons",
	"sap.zen.crosstab",
	"sap.zen.dsh",
];

export default class UI5YamlLinter {
	#content = "";
	#fromYamlContent: DataWithPosition = "";
	#path = "";
	#messages: LintMessage[] = [];
	#coverageInfo: CoverageInfo[] = [];

	constructor(content: string, path: string) {
		this.#content = content;
		this.#path = path;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async getReport(): Promise<LintResult> {
		const source: any = this.#parseUI5Yaml(this.#content);
		this.#analyzeUI5Yaml(source);

		let errorCount = 0;
		let warningCount = 0;
		let fatalErrorCount = 0;
		for (const {severity, fatal} of this.#messages) {
			if (severity === LintMessageSeverity.Error) {
				errorCount++;
				if (fatal) {
					fatalErrorCount++;
				}
			} else {
				warningCount++;
			}
		}

		return {
			filePath: this.#path,
			messages: this.#messages,
			coverageInfo: this.#coverageInfo,
			errorCount,
			fatalErrorCount,
			warningCount,
		};
	}

	#parseUI5Yaml(fileContent: string) {
		this.#fromYamlContent = fromYaml(fileContent);
		return yaml.load(fileContent);
	}

	#analyzeUI5Yaml(ui5YamlObject: {framework: {libraries: {name: any}[]}}) { // maybe add ui5.yaml specific schema (https://sap.github.io/ui5-tooling/schema/ui5.yaml.json)?
		// Check for deprecated libraries
		if (ui5YamlObject?.framework?.libraries?.length) {
			ui5YamlObject.framework.libraries.forEach((lib: {name: any}, index: number) => {
				if (deprecatedLibraries.includes(lib.name)) {
					const positionInfo = getPosition(this.#fromYamlContent.framework.libraries[index]);
					this.#messages.push({
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
