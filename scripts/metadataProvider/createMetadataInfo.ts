import {writeFile} from "node:fs/promises";
import MetadataProvider from "./MetadataProvider.js";

import {
	forEachSymbol,
} from "@ui5-language-assistant/semantic-model";

async function main(apiJsonsRoot: string, sapui5Version: string) {
	const metadataProvider = new MetadataProvider();
	await metadataProvider.init(apiJsonsRoot);

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

try {
	const apiJsonsRoot = process.argv[2];
	if (!apiJsonsRoot) {
		throw new Error("first argument 'apiJsonsRoot' is missing");
	}
	const sapui5Version = process.argv[3];
	if (!sapui5Version) {
		throw new Error("second argument 'sapui5Version' is missing");
	}
	await main(apiJsonsRoot, sapui5Version);
} catch (err) {
	process.stderr.write(String(err));
	process.exit(1);
}
