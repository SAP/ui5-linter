import type {
	SAPJSONSchemaForWebApplicationManifestFile,
	JSONSchemaForSAPUI5Namespace,
	JSONSchemaForSAPAPPNamespace,
	Model as ManifestModel,
	DataSource as ManifestDataSource,
} from "../../manifest.d.ts";

import ManifestReporter from "./ManifestReporter.js";
import {LintMessageSeverity, ResourcePath} from "../LinterContext.js";
import jsonMap from "json-source-map";
import LinterContext from "../LinterContext.js";
import {deprecatedLibraries, deprecatedComponents} from "../../utils/deprecations.js";
import {RULES, MESSAGES, formatMessage} from "../linterReporting.js";

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
	#reporter: ManifestReporter | undefined;
	#content: string;
	#resourcePath: string;
	#context: LinterContext;

	constructor(resourcePath: ResourcePath, content: string, context: LinterContext) {
		this.#resourcePath = resourcePath;
		this.#content = content;
		this.#context = context;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async lint() {
		try {
			const source = this.#parseManifest(this.#content);
			this.#reporter = new ManifestReporter(this.#resourcePath, this.#context, source);
			this.#analyzeManifest(source.data);
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

	#parseManifest(manifest: string): jsonSourceMapType {
		return jsonMap.parse<jsonSourceMapType>(manifest);
	}

	#analyzeManifest(manifest: SAPJSONSchemaForWebApplicationManifestFile) {
		const {resources, models, dependencies} = (manifest["sap.ui5"] ?? {} as JSONSchemaForSAPUI5Namespace);
		const {dataSources} = (manifest["sap.app"] ?? {} as JSONSchemaForSAPAPPNamespace);

		// Detect deprecated libraries:
		const libKeys: string[] = (dependencies?.libs && Object.keys(dependencies.libs)) ?? [];
		libKeys.forEach((libKey: string) => {
			if (deprecatedLibraries.includes(libKey)) {
				this.#reporter?.addMessage({
					node: `/sap.ui5/dependencies/libs/${libKey}`,
					severity: LintMessageSeverity.Error,
					ruleId: RULES["ui5-linter-no-deprecated-library"],
					message: formatMessage(MESSAGES.SHORT__DEPRECATED_LIBRARY, libKey),
				});
			}
		});

		// Detect deprecated components:
		const componentKeys: string[] = (dependencies?.components && Object.keys(dependencies.components)) ?? [];
		componentKeys.forEach((componentKey: string) => {
			if (deprecatedComponents.includes(componentKey)) {
				this.#reporter?.addMessage({
					node: `/sap.ui5/dependencies/components/${componentKey}`,
					severity: LintMessageSeverity.Error,
					ruleId: RULES["ui5-linter-no-deprecated-component"],
					message: formatMessage(MESSAGES.SHORT__DEPRECATED_COMPONENT, componentKey),
				});
			}
		});

		if (resources?.js) {
			this.#reporter?.addMessage({
				node: "/sap.ui5/resources/js",
				severity: LintMessageSeverity.Error,
				ruleId: RULES["ui5-linter-no-deprecated-api"],
				message: formatMessage(MESSAGES.SHORT__DEPRECATED_PROP, "'sap.ui5/resources/js'"),
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
					ruleId: RULES["ui5-linter-no-deprecated-api"],
					message: formatMessage(MESSAGES.SHORT__DEPRECATED_MODEL_TYPE,
						`sap.ui5/models/${modelKey}/type="${curModel.type}"`)
					,
				});
			}

			if (curModel.type === "sap.ui.model.odata.v4.ODataModel" &&
				curModel.settings && "synchronizationMode" in curModel.settings) {
				this.#reporter?.addMessage({
					node: `/sap.ui5/models/${modelKey}/settings/synchronizationMode`,
					severity: LintMessageSeverity.Error,
					ruleId: RULES["ui5-linter-no-deprecated-api"],
					message: formatMessage(MESSAGES.SHORT__DEPRECATED_PROP,
						`'sap.ui5/models/${modelKey}/settings/synchronizationMode' of sap.ui.model.odata.v4.ODataModel`
					),
				});
			}
		});
	}
}
