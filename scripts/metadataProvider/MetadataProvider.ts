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

type SymbolOption = "aggregation" | "association" | "defaultAggregation" | "event" | "property";
type SymbolOptionValues = Record<string, SymbolOption>;

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
	 * Collects all option values (aggregation, association, defaultAggregation, event, method, property)
	 * for a given symbol (incl. borrowed ones).
	 * @param {BaseUI5Node} symbol
	 * @returns {SymbolOptionValues}
	 */
	collectOptionValuesForSymbol(symbol: BaseUI5Node): SymbolOptionValues | undefined {
		const symbolOptionValues: SymbolOptionValues = {};
		let symbolMetadata;

		switch (symbol.kind) {
			case "UI5Class":
				symbolMetadata = symbol as UI5Class;
				// Collect own and borrowed option values:
				while (symbolMetadata.extends) {
					symbolMetadata.aggregations.forEach((aggregation) => {
						symbolOptionValues[aggregation.name] = "aggregation";
					});
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
					symbolMetadata = symbolMetadata.extends;
				}
				break;
			/* case "UI5Enum": // Disabled because UI5Enum does not contain any option values
				symbolMetadata = symbol as UI5Enum;
				break;
			case "UI5Function": // Disabled because UI5Function does not contain any option values
				symbolMetadata = symbol as UI5Function;
				break; */
			case "UI5Namespace":
				symbolMetadata = symbol as UI5Namespace;
				symbolMetadata.events.forEach((event) => {
					symbolOptionValues[event.name] = "event";
				});
				break;
			case "UI5Typedef":
				symbolMetadata = symbol as UI5Typedef;
				// NPM package "@ui5-language-assistant/semantic-model-types" was not updated:
				// symbolMetadata.properties.forEach((property) => {
				// 	symbolOptionValues[property.name] = "property";
				// });
				break;
			case "UI5Interface":
				symbolMetadata = symbol as UI5Interface;
				symbolMetadata.events.forEach((event) => {
					symbolOptionValues[event.name] = "event";
				});
				break;
			default:
				return undefined;
		}
		return symbolOptionValues;
	}
}
