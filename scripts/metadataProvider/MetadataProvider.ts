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
	UI5Enum,
	UI5Function,
} from "@ui5-language-assistant/semantic-model-types";
import {MetadataRecord} from "../../src/utils/ApiExtract.js";

function getDeprecationText(deprecatedInfo: BaseUI5Node["deprecatedInfo"]): string | null {
	if (!deprecatedInfo?.isDeprecated) {
		return null;
	}
	const text = (deprecatedInfo.since ? `(since ${deprecatedInfo.since}) ` : "") +
		(deprecatedInfo.text ? `${deprecatedInfo.text}` : "");

	// If the text is empty, return null so that a default value can be used
	return text || null;
}

const hasFieldsProperty = function (type: unknown): type is UI5Class | UI5Enum | UI5Namespace {
	return (type as UI5Class | UI5Enum | UI5Namespace).fields !== undefined;
};

export type AllowedSymbol = UI5Class | UI5Enum | UI5Interface | UI5Namespace | UI5Typedef | UI5Function;

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
	collectOptionsForSymbol(symbol: AllowedSymbol): MetadataRecord | undefined {
		const outputSymbolRecord: MetadataRecord = {
			kind: symbol.kind,
		};
		let symbolMetadata;

		switch (symbol.kind) {
			case "UI5Class":
				outputSymbolRecord.kind = symbol.kind;
				symbolMetadata = symbol;
				while (symbolMetadata) {
					symbolMetadata.aggregations.forEach((aggregation) => {
						if (!outputSymbolRecord.aggregations) outputSymbolRecord.aggregations = [];
						outputSymbolRecord.aggregations.push(aggregation.name);
					});
					symbolMetadata.associations.forEach((association) => {
						if (!outputSymbolRecord.associations) outputSymbolRecord.associations = [];
						outputSymbolRecord.associations.push(association.name);
					});
					if (symbolMetadata.defaultAggregation) {
						outputSymbolRecord.defaultAggregation = symbolMetadata.defaultAggregation.name;
					}
					symbolMetadata.events.forEach((event) => {
						if (!outputSymbolRecord.events) outputSymbolRecord.events = [];
						outputSymbolRecord.events.push(event.name);
					});
					symbolMetadata.properties.forEach((property) => {
						if (!outputSymbolRecord.properties) outputSymbolRecord.properties = [];
						outputSymbolRecord.properties.push(property.name);
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
				symbolMetadata = symbol;
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
				symbolMetadata = symbol;
				/* Disabled, as "UI5Typedef" not being required:
				symbolMetadata.fields.forEach((field) => {
				 	outputSymbolRecord[field.name] = "field";
				}); */
				break;
			case "UI5Interface":
				symbolMetadata = symbol;
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

		// Symbol deprecation:
		if (symbol.deprecatedInfo?.isDeprecated) {
			const deprecationText = getDeprecationText(symbol.deprecatedInfo) ?? "deprecated";
			outputSymbolRecord.deprecations = {
				"": deprecationText,
			};
		}

		// Fields deprecation:
		if (hasFieldsProperty(symbol)) {
			symbol.fields?.forEach((field) => {
				if (field?.deprecatedInfo?.isDeprecated) {
					outputSymbolRecord.deprecations ??= {};
					const deprecationText = getDeprecationText(field.deprecatedInfo) ?? "deprecated";
					outputSymbolRecord.deprecations[field.name] = deprecationText;
				}
			});
		}

		// Check if symbol has any information other than "kind" and return undefined if not:
		if (Object.keys(outputSymbolRecord).length < 2) {
			return undefined;
		} else {
			return outputSymbolRecord;
		}
	}
}
