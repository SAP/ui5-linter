import {readFile} from "node:fs/promises";

export type AllowedSymbolKind = "UI5Class" | "UI5Enum" | "UI5Interface" | "UI5Namespace" | "UI5Typedef" | "UI5Function";
export type AllowedMetadataOptions = "aggregation" | "association" | "defaultAggregation" | "event" |
	"method" | "property";

export interface ApiExtractJson {
	framework: {
		name: string;
		version: string;
	};
	metadata: Record<string, Record<string, AllowedMetadataOptions>>;
	deprecations: Record<AllowedSymbolKind, Record<string, string>>;
}

interface DeprecationInfo {
	symbolKind: AllowedSymbolKind;
	text: string;
}

export interface ApiExtract {
	getDefaultAggregation(className: string): string | undefined;
	getDeprecationInfo(symbolName: string): DeprecationInfo | undefined;
}

class ApiExtractImpl implements ApiExtract {
	private data: ApiExtractJson;

	constructor(data: ApiExtractJson) {
		this.data = data;
	}

	getDefaultAggregation(className: string): string {
		// TODO: Implement this method with some clever logic
		// (Don't loop through entire metadata and check each symbol's default aggregation)
		return className;
	}

	getDeprecationInfo(symbolName: string): DeprecationInfo | undefined {
		for (const [kind, list] of Object.entries(this.data.deprecations)) {
			if (list[symbolName]) {
				const symbolKind = kind as AllowedSymbolKind;
				return {
					symbolKind,
					text: list[symbolName],
				};
			}
		}
	}
}

let resolveWithSingleton: Promise<ApiExtract>;

export async function loadApiExtract(): Promise<ApiExtract> {
	if (resolveWithSingleton == null) {
		resolveWithSingleton = (async () => {
			const data = await readFile(
				new URL("../../resources/api-extract.json", import.meta.url),
				{encoding: "utf-8"});
			return new ApiExtractImpl(JSON.parse(data) as ApiExtractJson);
		})();
	}
	return resolveWithSingleton;
}
