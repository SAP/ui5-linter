import {createSemanticModel} from "./model.js";

import {
	findSymbol,
} from "@ui5-language-assistant/semantic-model";
import {
	BaseUI5Node,
	UI5Aggregation,
	UI5Class,
	UI5SemanticModel,
} from "@ui5-language-assistant/semantic-model-types";

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

	// TODO: Add collection logic for associations, events, methods, properties (also inherited ones)
	// + Use only one loop for all collections to save performance
	getAggregationsForSymbol(symbol: BaseUI5Node): UI5Aggregation[] | undefined {
		if (symbol.kind !== "UI5Class") {
			return undefined;
		}
		let classMetadata = symbol as UI5Class;
		// Collect own aggregations:
		const ownAndBorrowedAggregations: UI5Aggregation[] = [];
		ownAndBorrowedAggregations.push(...classMetadata.aggregations);

		// Go up the inheritance chain and collect aggregations from all parent objects:
		while (classMetadata.extends) {
			classMetadata = classMetadata.extends;
			if (classMetadata.aggregations) {
				ownAndBorrowedAggregations.push(...classMetadata.aggregations);
			}
		}

		return ownAndBorrowedAggregations;
	}
}
