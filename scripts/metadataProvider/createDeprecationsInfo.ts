import {writeFile} from "node:fs/promises";
import MetadataProvider from "./MetadataProvider.js";

export default async function createDeprecationsInfo(apiJsonsRoot: string, sapui5Version: string) {
	const metadataProvider = new MetadataProvider();
	await metadataProvider.init(apiJsonsRoot, sapui5Version);

	const semanticModel = metadataProvider.getModel();

	const deprecations: Record<string, Record<string, string>> = {};
	for (const [aaaaName, aaaa] of Object.entries(semanticModel)) {
		if (typeof aaaa !== "object" || Array.isArray(aaaa)) {
			continue;
		}

		deprecations[aaaaName] = deprecations[aaaaName] ?? {};

		// forEachSymbol(aaaa, (type, typeName) => {
		for (const [typeName, type] of Object.entries(aaaa)) {
			if (type?.deprecatedInfo?.isDeprecated) {
				deprecations[aaaaName][typeName] = "deprecated";
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
