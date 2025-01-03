/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import {createSemanticModel} from "./model.js";

import {
	findSymbol,
} from "@ui5-language-assistant/semantic-model";
import {
	BaseUI5Node,
	UI5Class,
	UI5Namespace,
	UI5Typedef,
	UI5Interface,
	UI5SemanticModel,
} from "@ui5-language-assistant/semantic-model-types";

type SymbolOption = "aggregation" | "association" | "defaultAggregation" | "event" | "method" | "property";
type SymbolOptionValue = string; // e.g. "press" | "text" | "items" | "firePress"
type SymbolName = string; // e.g. "sap.m.Button" | "jQuery.sap" | "module:sap/base/Event" | "sap.ui.base.Object"
type SymbolOptionValues = Record<SymbolOptionValue | "extends", SymbolOption | SymbolName>;

export default class MetadataProvider {
	#model: UI5SemanticModel | null = null;
	async init(apiJsonsRoot: string, sapui5Version: string) {
		this.#model = await createSemanticModel(apiJsonsRoot, sapui5Version);
	}

	getModel(): UI5SemanticModel {
		if (!this.#model) {
			throw new Error(`Model not yet initialized`);
		}
		return this.#model;
	}

	getDefaultAggregationForControl(controlName: string): string | undefined {
		// console.time("getDefaultAggregationForControl");
		const controlMetadata = findSymbol(this.getModel(), controlName);
		if (controlMetadata) {
			return this.getDefaultAggregationForSymbol(controlMetadata);
		}
	}

	getDefaultAggregationForSymbol(symbol: BaseUI5Node): string | undefined {
		// console.time("getDefaultAggregationForSymbol");
		if (symbol.kind !== "UI5Class") {
			return undefined;
		}
		let classMetadata = symbol as UI5Class;
		while (!classMetadata.defaultAggregation) {
			if (!classMetadata.extends) {
				return undefined;
			}
			classMetadata = classMetadata.extends;
		}
		// console.timeEnd("getDefaultAggregationForSymbol");
		return classMetadata.defaultAggregation?.name;
	}

	/**
	 * Collects all option values for a given symbol.
	 * Possible option values: "aggregation" | "association" | "defaultAggregation" | "event" | "method" | "property".
	 * By providing includeBorrowed = true, borrowed option values from parent classes are included.
	 * If not (default), an "extends" entry with the symbolname is added to the result.
	 * @param {BaseUI5Node} symbol
	 * @param {boolean} includeBorrowed
	 * @returns {SymbolOptionValues}
	 */
	collectOptionValuesForSymbol(symbol: BaseUI5Node, includeBorrowed = false): SymbolOptionValues | undefined {
		const symbolOptionValues: SymbolOptionValues = {};
		let symbolMetadata;

		// TODO: If includeBorrowed = true, '"Type": "property"' is collected for every Symbol??
		switch (symbol.kind) {
			case "UI5Class":
				symbolMetadata = symbol as UI5Class;
				do {
					if (symbolMetadata) {
						for (const aggregation of symbolMetadata.aggregations) {
							// Check if defaultAggregation is already collected to prevent overwriting
							if (!symbolOptionValues[aggregation.name]) {
								symbolOptionValues[aggregation.name] = "aggregation";
							}
						};
						symbolMetadata.associations.forEach((association) => {
							symbolOptionValues[association.name] = "association";
						});
						if (symbolMetadata.defaultAggregation) {
							symbolOptionValues[symbolMetadata.defaultAggregation.name] = "defaultAggregation";
						}
						symbolMetadata.events.forEach((event) => {
							symbolOptionValues[event.name] = "event";
						});
						symbolMetadata.properties.forEach((property) => {
							symbolOptionValues[property.name] = "property";
						});
						/* Disabled, as not being required:
						symbolMetadata.methods.forEach((method) => {
							symbolOptionValues[method.name] = "method";
						}); */
						if (includeBorrowed) symbolMetadata = symbolMetadata.extends;
						else if (symbolMetadata.extends) symbolOptionValues.extends =
							`${symbolMetadata.extends.library}.${symbolMetadata.extends.name}`;
					}
				} while (includeBorrowed && symbolMetadata?.extends);
				break;
			/* case "UI5Enum": // Disabled, as UI5Enum does not contain any option values (with 1.131.1)
				symbolMetadata = symbol as UI5Enum;
				break;
			case "UI5Function": // Disabled, as UI5Function does not contain any option values (with 1.131.1)
				symbolMetadata = symbol as UI5Function;
				break; */
			case "UI5Namespace":
				symbolMetadata = symbol as UI5Namespace;
				symbolMetadata.events.forEach((event) => {
					symbolOptionValues[event.name] = "event";
				});
				/* Disabled, as not being required:
				symbolMetadata.methods.forEach((method) => {
					symbolOptionValues[method.name] = "method";
				}); */
				break;
			case "UI5Typedef":
				symbolMetadata = symbol as UI5Typedef;
				/* NPM package "@ui5-language-assistant/semantic-model-types" was not updated:
				symbolMetadata.properties.forEach((property) => {
				 	symbolOptionValues[property.name] = "property";
				}); */
				break;
			case "UI5Interface":
				symbolMetadata = symbol as UI5Interface;
				symbolMetadata.events.forEach((event) => {
					symbolOptionValues[event.name] = "event";
				});
				/* Disabled, as not being required:
				symbolMetadata.methods.forEach((method) => {
					symbolOptionValues[method.name] = "method";
				}); */
				break;
			default:
				return undefined;
		}
		return symbolOptionValues;
	}
}
