import type {
	SAPJSONSchemaForWebApplicationManifestFile,
	JSONSchemaForSAPUI5Namespace,
	JSONSchemaForSAPAPPNamespace,
	Model as ManifestModel,
	DataSource as ManifestDataSource,
} from "../../manifest.d.ts";
import type {LintResult} from "../../detectors/AbstractDetector.js";

import ManifestReporter from "./ManifestReporter.js";
import {LintMessageSeverity} from "../../detectors/AbstractDetector.js";
import jsonMap from "json-source-map";

interface locType {
	line: number;
	column: number;
	pos: number;
}

export type jsonMapPointers = Record<string, {key: locType; keyEnd: locType; value: locType; valueEnd: locType}>;

export interface jsonSourceMapType {
	data: SAPJSONSchemaForWebApplicationManifestFile;
	pointers: jsonMapPointers;
}

export default class ManifestLinter {
	#reporter: ManifestReporter | null;
	#content = "";
	#path = "";

	constructor(content: string, path: string) {
		this.#reporter = null;
		this.#content = content;
		this.#path = path;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async getReport(): Promise<LintResult> {
		const source = this.#parseManifest(this.#content);
		this.#reporter = new ManifestReporter(this.#path, source);
		this.#analyzeManifest(source.data);

		const report = this.#reporter.getReport();
		return report;
	}

	#parseManifest(manifest: string): jsonSourceMapType {
		return jsonMap.parse<jsonSourceMapType>(manifest);
	}

	#analyzeManifest(manifest: SAPJSONSchemaForWebApplicationManifestFile) {
		const {resources, models} = (manifest["sap.ui5"] ?? {} as JSONSchemaForSAPUI5Namespace);
		const {dataSources} = (manifest["sap.app"] ?? {} as JSONSchemaForSAPAPPNamespace);

		if (resources?.js) {
			this.#reporter?.addMessage({
				node: "/sap.ui5/resources/js",
				severity: LintMessageSeverity.Error,
				ruleId: "ui5-linter-no-deprecated-api",
				message: `Use of deprecated property 'sap.ui5/resources/js'`,
			});
		}

		const modelKeys: string[] = (models && Object.keys(models)) ?? [];
		modelKeys.forEach((modelKey: string) => {
			const curModel: ManifestModel = (models?.[modelKey]) ?? {};

			if (!curModel.type) {
				const curDataSource = dataSources && curModel.dataSource &&
					dataSources[curModel.dataSource] as ManifestDataSource | undefined;

				if (curDataSource &&
					/* if not provided dataSource.type="OData" */
					(curDataSource.type === "OData" || !curDataSource.type)) {
					curModel.type = curDataSource.settings?.odataVersion === "4.0" ?
						"sap.ui.model.odata.v4.ODataModel" :
						"sap.ui.model.odata.v2.ODataModel";
				}
				// There are other types that can be found in sap/ui/core/Component, but the one
				// we actually care here is just the "sap.ui.model.odata.v4.ODataModel"
			}

			if (curModel.type && [
				"sap.ui.model.odata.ODataModel",
				"sap.zen.dsh.widgets.SDKModel",
			].includes(curModel.type)) {
				this.#reporter?.addMessage({
					node: `/sap.ui5/models/${modelKey}/type`,
					severity: LintMessageSeverity.Error,
					ruleId: "ui5-linter-no-deprecated-api",
					message: `Use of deprecated model type ` +
					`'sap.ui5/models/${modelKey}/type="${curModel.type}"'`,
				});
			}

			if (curModel.type === "sap.ui.model.odata.v4.ODataModel" &&
				curModel.settings && "synchronizationMode" in curModel.settings) {
				this.#reporter?.addMessage({
					node: `/sap.ui5/models/${modelKey}/settings/synchronizationMode`,
					severity: LintMessageSeverity.Error,
					ruleId: "ui5-linter-no-deprecated-api",
					message: `Use of deprecated property ` +
					`'sap.ui5/models/${modelKey}/settings/synchronizationMode' of sap.ui.model.odata.v4.ODataModel`,
				});
			}
		});
	}
}
