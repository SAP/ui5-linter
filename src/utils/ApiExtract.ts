/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import {readFile} from "node:fs/promises";

export type AllowedSymbolKind = "UI5Class" | "UI5Enum" | "UI5Interface" | "UI5Namespace" | "UI5Typedef" | "UI5Function";
export type AllowedMetadataOptionType = "aggregations" | "associations" | "defaultAggregation" | "events" |
	"methods" | "properties";
/** @example "sap.m.Button" | "jQuery.sap" | "module:sap/base/Event" | "sap.ui.base.Object" */
type UI5SymbolName = string;
/** @example "sap.m.App": { "properties": ["backgroundColor", ...], ..., "extends": "sap.m.NavContainer" } */
export interface MetadataRecord {
	aggregations?: string[];
	defaultAggregation?: string;
	associations?: string[];
	events?: string[];
	methods?: string[];
	properties?: string[];
	extends?: UI5SymbolName;
};

export interface ApiExtractJson {
	framework: {
		name: string;
		version: string;
	};
	metadata: Record<string, MetadataRecord>;
	deprecations: Record<AllowedSymbolKind, Record<string, string>>;
}

interface DeprecationInfo {
	symbolKind: AllowedSymbolKind;
	text: string;
}

export interface ApiExtract {
	getAllOptionsByType(symbolName: string, option: AllowedMetadataOptionType, includeBorrowed?: boolean):
		string[] | undefined;
	getTypeByOption(symbolName: string, optionName: string, includeBorrowed?: boolean):
		AllowedMetadataOptionType | string | undefined;
	getDefaultAggregation(className: string): string | undefined;
	getDeprecationInfo(symbolName: string): DeprecationInfo | undefined;
}

export class ApiExtractImpl implements ApiExtract {
	private data: ApiExtractJson;

	constructor(data: ApiExtractJson) {
		this.data = data;
	}

	/**
	 * Returns all options of a given option type in a UI5 symbol.
	 * (including borrowed ones is optional)
	 * @example getAllOptionsByType("sap.m.App", "properties", false)
	 * 	returns ["backgroundColor", "backgroundImage", "backgroundRepeat", *etc.*]
	 * @example getAllOptionsByType("sap.m.App", "notExistingOptionType")
	 * 	returns []
	 * @example getAllOptionsByType("sap.xyz.notExistingSymbol", "properties")
	 * 	returns undefined
	 */
	getAllOptionsByType(symbolName: string, optionType: AllowedMetadataOptionType, includeBorrowed = false):
		string[] | undefined {
		const values: string[] = [];
		let foundSymbolRecord = this.data.metadata[symbolName];
		if (!foundSymbolRecord) {
			return undefined;
		}
		// Check own options and resolve borrowed options with "extends":
		while (foundSymbolRecord) {
			if (foundSymbolRecord[optionType]) {
				values.push(...foundSymbolRecord[optionType]);
			}
			if (includeBorrowed && foundSymbolRecord.extends) {
				foundSymbolRecord = this.data.metadata[foundSymbolRecord.extends];
			} else {
				break;
			}
		}
		return values;
	}

	/**
	 * Returns the type of a given option in a UI5 symbol record.
	 * (resolving borrowed ones is optional)
	 * @example getTypeByOption("sap.m.App", "backgroundColor")
	 * 	returns "properties"
	 * @example getTypeByOption("sap.m.App", "notExistingOption")
	 * 	returns undefined
	 * @example getTypeByOption("sap.xyz.notExistingSymbol", "backgroundColor")
	 * 	returns undefined
	 */
	getTypeByOption(symbolName: string, optionName: string, includeBorrowed = false):
		AllowedMetadataOptionType | string | undefined {
		let foundSymbolRecord = this.data.metadata[symbolName];
		// Check own types and resolve borrowed types with "extends":
		while (foundSymbolRecord) {
			// Loop through all keys of the symbol record:
			for (const [key, value] of Object.entries(foundSymbolRecord)) {
				if ((Array.isArray(value) && value.includes(optionName)) || value === optionName) {
					return key;
				}
			}
			if (includeBorrowed && foundSymbolRecord.extends) {
				foundSymbolRecord = this.data.metadata[foundSymbolRecord.extends];
			} else {
				break;
			}
		}
		return undefined;
	};

	/**
	 * Returns the default aggregation of a given UI5 class.
	 * (returns a borrowed one too)
	 * @example getDefaultAggregation("sap.m.App")
	 * 	returns "pages"
	 */
	getDefaultAggregation(symbolName: string): string | undefined {
		let foundSymbolRecord = this.data.metadata[symbolName];
		// Check own defaultAggregation and resolve borrowed one with "extends":
		while (foundSymbolRecord) {
			if (foundSymbolRecord.defaultAggregation) {
				return foundSymbolRecord.defaultAggregation;
			}
			if (foundSymbolRecord.extends) {
				foundSymbolRecord = this.data.metadata[foundSymbolRecord.extends];
			} else {
				break;
			}
		}
		return undefined;
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
