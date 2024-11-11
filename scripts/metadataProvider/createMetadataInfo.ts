import {writeFile} from "node:fs/promises";
import MetadataProvider from "./MetadataProvider.js";

import {
	forEachSymbol,
} from "@ui5-language-assistant/semantic-model";
import type {
	BaseUI5Node,
	UI5Class,
	UI5Enum,
	UI5Namespace,
} from "@ui5-language-assistant/semantic-model-types";
import {AllowedSymbolKind, ApiExtractJson} from "../../src/utils/ApiExtract.js";

const hasFieldsProperty = function (type: unknown): type is UI5Class | UI5Enum | UI5Namespace {
	return (type as UI5Class | UI5Enum | UI5Namespace).fields !== undefined;
};

const isAllowedSymbolKind = function (kind: string): kind is AllowedSymbolKind {
	return ["UI5Class", "UI5Enum", "UI5Interface", "UI5Namespace", "UI5Typedef", "UI5Function"].includes(kind);
};

function getDeprecationText(deprecatedInfo: BaseUI5Node["deprecatedInfo"]): string | null {
	if (!deprecatedInfo?.isDeprecated) {
		return null;
	}
	const text = (deprecatedInfo.since ? `(since ${deprecatedInfo.since}) ` : "") +
		(deprecatedInfo.text ? `${deprecatedInfo.text}` : "");

	// If the text is empty, return null so that a default value can be used
	return text || null;
}

export default async function createMetadataInfo(apiJsonsRoot: string, sapui5Version: string) {
	const metadataProvider = new MetadataProvider();
	await metadataProvider.init(apiJsonsRoot, sapui5Version);

	const semanticModel = metadataProvider.getModel();

	const apiExtract: ApiExtractJson = {
		framework: {
			name: "SAPUI5",
			version: sapui5Version,
		},
		defaultAggregations: {},
		deprecations: {
			UI5Class: {},
			UI5Enum: {},
			UI5Function: {},
			UI5Namespace: {},
			UI5Typedef: {},
			UI5Interface: {},
		},
	};

	forEachSymbol(semanticModel, (symbol, symbolName) => {
		const defaultAggregation = metadataProvider.getDefaultAggregationForSymbol(symbol);
		if (defaultAggregation) {
			apiExtract.defaultAggregations[symbolName] = defaultAggregation;
		}

		if (symbol.deprecatedInfo?.isDeprecated) {
			const deprecationText = getDeprecationText(symbol.deprecatedInfo) ?? "deprecated";
			if (isAllowedSymbolKind(symbol.kind)) {
				apiExtract.deprecations[symbol.kind] = apiExtract.deprecations[symbol.kind] ?? {};
				apiExtract.deprecations[symbol.kind][symbolName] = deprecationText;
			}
		}

		if (hasFieldsProperty(symbol)) {
			symbol.fields?.forEach((field) => {
				if (field?.deprecatedInfo?.isDeprecated) {
					apiExtract.deprecations[symbol.kind] = apiExtract.deprecations[symbol.kind] ?? {};
					const deprecationText = getDeprecationText(field.deprecatedInfo) ?? "deprecated";
					apiExtract.deprecations[symbol.kind][symbolName + "." + field.name] = deprecationText;
				}
			});
		}
	});

	await writeFile(
		new URL("../../resources/api-extract.json", import.meta.url),
		JSON.stringify(apiExtract, null, 2) + "\n"
	);
}
