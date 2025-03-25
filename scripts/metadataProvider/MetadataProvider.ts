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

/** @example "press" | "text" | "items" | "firePress" */
type UI5OptionValue = string;
/** @example "sap.m.Button" | "jQuery.sap" | "module:sap/base/Event" | "sap.ui.base.Object" */
type UI5SymbolName = string;
export interface UI5SymbolRecord {
	aggregation?: UI5OptionValue[];
	defaultAggregation?: UI5OptionValue;
	association?: UI5OptionValue[];
	event?: UI5OptionValue[];
	method?: UI5OptionValue[];
	property?: UI5OptionValue[];
	extends?: UI5SymbolName;
};

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
	 * Collects all options for a given UI5 symbol.
	 * Borrowed options from parent classes are NOT included in the result
	 * but an "extends" placeholder with the parent symbolname is added instead.
	 * (e.g. "sap.m.App": {..., "extends": "sap.m.NavContainer"})
	 */
	collectOptionsForSymbol(symbol: BaseUI5Node): UI5SymbolRecord | undefined {
		const outputSymbolRecord: UI5SymbolRecord = {};
		let symbolMetadata;

		switch (symbol.kind) {
			case "UI5Class":
				symbolMetadata = symbol as UI5Class;
				while (symbolMetadata) {
					symbolMetadata.aggregations.forEach((aggregation) => {
						outputSymbolRecord.aggregation ??= [];
						outputSymbolRecord.aggregation.push(aggregation.name);
						/* The following is necessary because some aggregations in UI5 can be defined as properties too,
						if they have a cardinality of "0..1" and define alternative types.
						E.g. "tooltip" of "sap.ui.core.Element" meets this criteria. */
						if (aggregation.cardinality === "0..1" && aggregation.altTypes.length) {
							outputSymbolRecord.property ??= [];
							outputSymbolRecord.property.push(aggregation.name);
						}
					});
					symbolMetadata.associations.forEach((association) => {
						outputSymbolRecord.association ??= [];
						outputSymbolRecord.association.push(association.name);
					});
					if (symbolMetadata.defaultAggregation) {
						outputSymbolRecord.defaultAggregation = symbolMetadata.defaultAggregation.name;
					}
					symbolMetadata.events.forEach((event) => {
						outputSymbolRecord.event ??= [];
						outputSymbolRecord.event.push(event.name);
					});
					symbolMetadata.properties.forEach((property) => {
						outputSymbolRecord.property ??= [];
						outputSymbolRecord.property.push(property.name);
					});
					/* Disabled, as "methods" not being required:
						symbolMetadata.methods.forEach((method) => {
							if (!outputSymbolRecord.methods) outputSymbolRecord.methods = [];
							outputSymbolRecord.methods.push(method.name);
						}); */
					if (symbolMetadata.extends) {
						/* The following is necessary because some libraries (e.g. "sap.ui.core")
						have more than one namespace. Hence, we have to traverse the parent tree
						and collect each "name" property to get the correct "extends" name: */
						let currNode: BaseUI5Node | undefined = symbolMetadata.extends;
						let extendsName = "";
						while (currNode) {
							extendsName = currNode.name + (extendsName ? "." : "") + extendsName;
							currNode = currNode.parent;
						}
						outputSymbolRecord.extends = extendsName;
						break;
					}
					symbolMetadata = symbolMetadata.extends;
				}
				break;
			/* case "UI5Enum": // Disabled, as UI5Enum does not contain any option values (with 1.131.1)
				symbolMetadata = symbol as UI5Enum;
				break;
			case "UI5Function": // Disabled, as UI5Function does not contain any option values (with 1.131.1)
				symbolMetadata = symbol as UI5Function;
				break; */
			case "UI5Namespace":
				symbolMetadata = symbol as UI5Namespace;
				/* Disabled, as "UI5Namespace" not being required:
				symbolMetadata.events.forEach((event) => {
					if (!outputSymbolRecord.events) outputSymbolRecord.events = [];
					outputSymbolRecord.events.push(event.name);
				});
				symbolMetadata.methods.forEach((method) => {
					if (!outputSymbolRecord.methods) outputSymbolRecord.methods = [];
					outputSymbolRecord.methods.push(method.name);
				}); */
				break;
			case "UI5Typedef":
				symbolMetadata = symbol as UI5Typedef;
				/* Disabled, as "UI5Typedef" not being required:
				symbolMetadata.fields.forEach((field) => {
				 	outputSymbolRecord[field.name] = "field";
				}); */
				break;
			case "UI5Interface":
				symbolMetadata = symbol as UI5Interface;
				/* Disabled, as "UI5Interface" not being required:
				symbolMetadata.events.forEach((event) => {
					if (!outputSymbolRecord.events) outputSymbolRecord.events = [];
					outputSymbolRecord.events.push(event.name);
				});
				symbolMetadata.methods.forEach((method) => {
					if (!outputSymbolRecord.methods) outputSymbolRecord.methods = [];
					outputSymbolRecord.methods.push(method.name);
				}); */
				break;
			default:
				return undefined;
		}
		// Check if symbol has any options and return undefined if not:
		return Object.keys(outputSymbolRecord).length === 0 ? undefined : outputSymbolRecord;
	}
}
