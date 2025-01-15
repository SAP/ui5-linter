import {readFile} from "node:fs/promises";

export type AllowedSymbolKind = "UI5Class" | "UI5Enum" | "UI5Interface" | "UI5Namespace" | "UI5Typedef" | "UI5Function";
export type AllowedMetadataOptionType = "aggregation" | "association" | "defaultAggregation" | "event" |
	"method" | "property";
/** @example "sap.m.Button" | "jQuery.sap" | "module:sap/base/Event" | "sap.ui.base.Object" */
type UI5SymbolName = string;
/** @example "sap.m.App": { "properties": ["backgroundColor", ...], ..., "extends": "sap.m.NavContainer" } */
export interface MetadataRecord {
	aggregation?: string[];
	defaultAggregation?: string;
	association?: string[];
	event?: string[];
	method?: string[];
	property?: string[];
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
	doesOptionExist(symbolName: string, optionName: string, optionType: AllowedMetadataOptionType,
		checkBorrowed?: boolean): boolean;
	getAllOptionsByType(symbolName: string, option: AllowedMetadataOptionType, includeBorrowed?: boolean):
		string[] | undefined;
	getTypeByOption(symbolName: string, optionName: string, checkBorrowed?: boolean):
		AllowedMetadataOptionType | undefined;
	getDefaultAggregation(className: string): string | undefined;
	getDeprecationInfo(symbolName: string): DeprecationInfo | undefined;
	isAggregation(symbolName: string, aggregationName: string, checkBorrowed?: boolean): boolean;
	isAssociation(symbolName: string, associationName: string, checkBorrowed?: boolean): boolean;
	isEvent(symbolName: string, eventName: string, checkBorrowed?: boolean): boolean;
	isMethod(symbolName: string, methodName: string, checkBorrowed?: boolean): boolean;
	isProperty(symbolName: string, propertyName: string, checkBorrowed?: boolean): boolean;
}

export class ApiExtractImpl implements ApiExtract {
	private data: ApiExtractJson;

	constructor(data: ApiExtractJson) {
		this.data = data;
	}

	/**
	 * Checks whether a given option is part of a UI5 symbol.
	 * @example doesOptionExist("sap.m.App", "backgroundColor", "property")
	 * 	returns true
	 * @example doesOptionExist("sap.m.App", "pages", "property") // pages is an aggregation
	 * 	returns false
	 */
	doesOptionExist(symbolName: string, optionName: string, optionType: AllowedMetadataOptionType,
		checkBorrowed = true): boolean {
		let foundSymbolRecord = this.data.metadata[symbolName];
		// Check own options and resolve borrowed options with "extends":
		while (foundSymbolRecord) {
			if (foundSymbolRecord[optionType]?.includes(optionName)) {
				return true;
			}
			if (checkBorrowed && foundSymbolRecord.extends) {
				foundSymbolRecord = this.data.metadata[foundSymbolRecord.extends];
			} else {
				break;
			}
		}
		return false;
	}

	/**
	 * Returns all options of a given option type in a UI5 symbol.
	 * (not including borrowed ones is optional)
	 * @example getAllOptionsByType("sap.m.App", "property", false)
	 * 	returns ["backgroundColor", "backgroundImage", "backgroundRepeat", *etc.*]
	 * @example getAllOptionsByType("sap.m.App", "notExistingOptionType")
	 * 	returns []
	 * @example getAllOptionsByType("sap.xyz.notExistingSymbol", "property")
	 * 	returns undefined
	 */
	getAllOptionsByType(symbolName: string, optionType: AllowedMetadataOptionType, includeBorrowed = true):
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
	 * (not checking borrowed ones is optional)
	 * @example getTypeByOption("sap.m.App", "backgroundColor")
	 * 	returns "properties"
	 * @example getTypeByOption("sap.m.App", "notExistingOption")
	 * 	returns undefined
	 * @example getTypeByOption("sap.xyz.notExistingSymbol", "backgroundColor")
	 * 	returns undefined
	 */
	getTypeByOption(symbolName: string, optionName: string, checkBorrowed = true):
		AllowedMetadataOptionType | undefined {
		let foundSymbolRecord = this.data.metadata[symbolName];
		// Check own types and resolve borrowed types with "extends":
		while (foundSymbolRecord) {
			// Loop through all keys of the symbol record:
			for (const [key, value] of Object.entries(foundSymbolRecord)) {
				if (key !== "extends" &&
					((Array.isArray(value) && value.includes(optionName)) || value === optionName)) {
					return key as AllowedMetadataOptionType;
				}
			}
			if (checkBorrowed && foundSymbolRecord.extends) {
				foundSymbolRecord = this.data.metadata[foundSymbolRecord.extends];
			} else {
				break;
			}
		}
		return undefined;
	};

	/**
	 * Checks whether a given aggregation is part of a UI5 symbol.
	 * @example isAggregation("sap.m.NavContainer", "pages")
	 * 	returns true
	 * @example isAggregation("sap.m.App", "pages", false) // pages is a borrowed aggregation of "sap.m.NavContainer"
	 * 	returns false
	 */
	isAggregation(symbolName: string, aggregationName: string, checkBorrowed = true): boolean {
		return this.doesOptionExist(symbolName, aggregationName, "aggregation", checkBorrowed);
	}

	/**
	 * Checks whether a given association is part of a UI5 symbol.
	 * @example isAssociation("sap.m.NavContainer", "initialPage")
	 * 	returns true
	 * @example isAssociation("sap.m.App", "initialPage", false) // initialPage is borrowed from "sap.m.NavContainer"
	 * 	returns false
	 */
	isAssociation(symbolName: string, associationName: string, checkBorrowed = true): boolean {
		return this.doesOptionExist(symbolName, associationName, "association", checkBorrowed);
	}

	/**
	 * Checks whether a given property is part of a UI5 symbol.
	 * @example isProperty("sap.m.App", "backgroundColor")
	 * 	returns true
	 * @example isProperty("sap.m.App", "pages") // pages is a borrowed default aggregation of "sap.m.NavContainer"
	 * 	returns false
	 */
	isProperty(symbolName: string, propertyName: string, checkBorrowed = true): boolean {
		return this.doesOptionExist(symbolName, propertyName, "property", checkBorrowed);
	}

	/**
	 * Checks whether a given event is part of a UI5 symbol.
	 * @example isEvent("sap.m.NavContainer", "afterNavigate")
	 * 	returns true
	 * @example isEvent("sap.m.App", "afterNavigate", false) // afterNavigate is borrowed from "sap.m.NavContainer"
	 * 	returns false
	 */
	isEvent(symbolName: string, eventName: string, checkBorrowed = true): boolean {
		return this.doesOptionExist(symbolName, eventName, "event", checkBorrowed);
	}

	/**
	 * Checks whether a given method is part of a UI5 symbol.
	 * @example isMethod("sap.m.App", "getBackgroundColor")
	 * 	returns true
	 * @example isMethod("sap.m.App", "addPage", false) // addPage is borrowed from "sap.m.NavContainer"
	 * 	returns false
	 */
	isMethod(symbolName: string, methodName: string, checkBorrowed = true): boolean {
		return this.doesOptionExist(symbolName, methodName, "method", checkBorrowed);
	}

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
