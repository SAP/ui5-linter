import {writeFile} from "node:fs/promises";
import MetadataProvider from "./MetadataProvider.js";
import {
	UI5Class,
	UI5Enum,
	UI5Namespace,
	UI5Interface,
	UI5Typedef,
	UI5Function,
} from "@ui5-language-assistant/semantic-model-types";
type ui5UnionType = UI5Class | UI5Enum | UI5Namespace | UI5Interface | UI5Typedef | UI5Function;
const hasFieldsProperty = function (type: unknown): type is UI5Class | UI5Enum | UI5Namespace {
	return (type as UI5Class | UI5Enum | UI5Namespace).fields !== undefined;
};

export default async function createDeprecationsInfo(apiJsonsRoot: string, sapui5Version: string) {
	const metadataProvider = new MetadataProvider();
	await metadataProvider.init(apiJsonsRoot, sapui5Version);

	const semanticModel = metadataProvider.getModel();

	const deprecations: Record<string, Record<string, string>> = {};
	for (const [modelName, model] of Object.entries(semanticModel)) {
		if (typeof model !== "object" || Array.isArray(model)) {
			continue;
		}

		deprecations[modelName] = deprecations[modelName] ?? {};

		for (const [typeName, type] of Object.entries(model as Record<string, ui5UnionType>)) {
			if (type?.deprecatedInfo?.isDeprecated) {
				deprecations[modelName][typeName] =
					`Deprecated since ${type.deprecatedInfo.since}. ${type.deprecatedInfo.text}`;
			}

			if (hasFieldsProperty(type)) {
				type.fields?.forEach((field) => {
					if (field?.deprecatedInfo?.isDeprecated) {
						deprecations[modelName][typeName + "." + field.name] = "deprecated";
					}
				});
			}
		}
	}

	const apiExtract = {
		framework: {
			name: "SAPUI5",
			version: sapui5Version,
		},
		deprecations,
	};

	await writeFile(
		new URL("../../resources/api-deprecations.json", import.meta.url),
		JSON.stringify(apiExtract, null, 2)
	);
}
