import {writeFile} from "node:fs/promises";
import MetadataProvider from "./MetadataProvider.js";
import path from "node:path";
import {fetchAndExtractAPIJsons, handleCli, cleanup, RAW_API_JSON_FILES_FOLDER} from "./helpers.js";

import {
	forEachSymbol,
} from "@ui5-language-assistant/semantic-model";

async function main(apiJsonsRoot: string, sapui5Version: string) {
	const metadataProvider = new MetadataProvider();
	await metadataProvider.init(apiJsonsRoot, sapui5Version);

	const semanticModel = metadataProvider.getModel();

	const defaultAggregations: Record<string, string> = {};
	forEachSymbol(semanticModel, (symbol, symbolName) => {
		const defaultAggregation = metadataProvider.getDefaultAggregationForSymbol(symbol);
		if (defaultAggregation) {
			defaultAggregations[symbolName] = defaultAggregation;
		}
	});

	const apiExtract = {
		framework: {
			name: "SAPUI5",
			version: sapui5Version,
		},
		defaultAggregations,
	};

	await writeFile(
		new URL("../../resources/api-extract.json", import.meta.url),
		JSON.stringify(apiExtract, null, 2)
	);
}

// Entrypoint
await handleCli(async (url, sapui5Version) => {
	await fetchAndExtractAPIJsons(url);

	await main(path.resolve(RAW_API_JSON_FILES_FOLDER), sapui5Version);

	await cleanup();
});
