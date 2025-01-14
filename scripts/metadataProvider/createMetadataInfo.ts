import {writeFile} from "node:fs/promises";
import MetadataProvider from "./MetadataProvider.js";

import {
	forEachSymbol,
} from "@ui5-language-assistant/semantic-model";
import type {
	BaseUI5Node,
	UI5Class,
	UI5Enum,
	UI5Function,
	UI5Interface,
	UI5Namespace,
	UI5Typedef,
} from "@ui5-language-assistant/semantic-model-types";
import {ApiExtractJson} from "../../src/utils/ApiExtract.js";

const isAllowedSymbol = function (symbol: BaseUI5Node):
	symbol is UI5Class | UI5Enum | UI5Interface | UI5Namespace | UI5Typedef | UI5Function {
	return ["UI5Class", "UI5Enum", "UI5Interface", "UI5Namespace", "UI5Typedef", "UI5Function"].includes(symbol.kind);
};

export default async function createMetadataInfo(apiJsonsRoot: string, sapui5Version: string) {
	const metadataProvider = new MetadataProvider();
	await metadataProvider.init(apiJsonsRoot, sapui5Version);

	const semanticModel = metadataProvider.getModel();

	const apiExtract: ApiExtractJson = {
		framework: {
			name: "SAPUI5",
			version: sapui5Version,
		},
		metadata: {},
	};

	forEachSymbol(semanticModel, (symbol, symbolName) => {
		// Generate metadata:
		if (isAllowedSymbol(symbol)) {
			const symbolRecord = metadataProvider.collectOptionsForSymbol(symbol);
			if (symbolRecord) {
				apiExtract.metadata[symbolName] = symbolRecord;
			}
		}
	});

	await writeFile(
		new URL("../../resources/api-extract.json", import.meta.url),
		JSON.stringify(apiExtract, null, 2) + "\n"
	);
}
