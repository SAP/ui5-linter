import LinterContext, {PositionInfo, ResourcePath} from "../LinterContext.js";
import {MESSAGE} from "../messages.js";
import {RequireDeclaration} from "../xmlTemplate/Parser.js";
import BindingParser, {
	AggregationBindingInfo, BindingInfo, FilterInfo, PropertyBindingInfo, SorterInfo,
} from "./lib/BindingParser.js";

export default class BindingLinter {
	#resourcePath: string;
	#context: LinterContext;

	constructor(resourcePath: ResourcePath, context: LinterContext) {
		this.#resourcePath = resourcePath;
		this.#context = context;
	}

	#parseBinding(binding: string): BindingInfo {
		const bindingInfo = BindingParser.complexParser(binding, null, true, true, true, true);
		return bindingInfo;
	}

	#analyzeCommonBindingParts(
		bindingInfo: BindingInfo, requireDeclarations: RequireDeclaration[], position: PositionInfo) {
		const {events} = bindingInfo;
		if (events && typeof events === "object") {
			for (const eventHandler of Object.values(events)) {
				this.#checkForGlobalReference(eventHandler, requireDeclarations, position);
			}
		}
	}

	#analyzePropertyBinding(
		bindingInfo: PropertyBindingInfo, requireDeclarations: RequireDeclaration[], position: PositionInfo) {
		this.#analyzeCommonBindingParts(bindingInfo, requireDeclarations, position);
		const {formatter, type} = bindingInfo;
		if (formatter) {
			this.#checkForGlobalReference(formatter, requireDeclarations, position);
		}
		if (type) {
			this.#checkForGlobalReference(type, requireDeclarations, position);
		}
	}

	#analyzeAggregationBinding(
		bindingInfo: AggregationBindingInfo, requireDeclarations: RequireDeclaration[], position: PositionInfo) {
		this.#analyzeCommonBindingParts(bindingInfo, requireDeclarations, position);
		const {factory, groupHeaderFactory, filters, sorter} = bindingInfo;
		if (factory) {
			this.#checkForGlobalReference(factory, requireDeclarations, position);
		}
		if (groupHeaderFactory) {
			this.#checkForGlobalReference(groupHeaderFactory, requireDeclarations, position);
		}
		if (filters) {
			this.#analyzeFilters(filters, requireDeclarations, position);
		}
		if (sorter) {
			this.#analyzeSorter(sorter, requireDeclarations, position);
		}
	}

	#analyzeFilters(
		filters: FilterInfo | FilterInfo[], requireDeclarations: RequireDeclaration[], position: PositionInfo) {
		if (Array.isArray(filters)) {
			for (const filter of filters) {
				this.#analyzeFilters(filter, requireDeclarations, position);
			}
			return;
		}
		const {test, filters: nestedFilters, condition} = filters;
		if (test) {
			this.#checkForGlobalReference(test, requireDeclarations, position);
		}
		if (nestedFilters) {
			this.#analyzeFilters(nestedFilters, requireDeclarations, position);
		}
		if (condition) {
			this.#analyzeFilters(condition, requireDeclarations, position);
		}
	}

	#analyzeSorter(
		sorter: SorterInfo | SorterInfo[], requireDeclarations: RequireDeclaration[], position: PositionInfo) {
		if (Array.isArray(sorter)) {
			for (const sorterItem of sorter) {
				this.#analyzeSorter(sorterItem, requireDeclarations, position);
			}
			return;
		}
		const {group, comparator} = sorter;
		if (group && typeof group !== "boolean") {
			this.#checkForGlobalReference(group, requireDeclarations, position);
		}
		if (comparator) {
			this.#checkForGlobalReference(comparator, requireDeclarations, position);
		}
	}

	#checkForGlobalReference(ref: string, requireDeclarations: RequireDeclaration[], position: PositionInfo) {
		if (ref.startsWith(".")) {
			// Ignore empty reference or reference to the controller (as indicated by the leading dot)
			return false;
		}
		const parts = ref.split(".");
		let variableName;
		if (parts.length) {
			variableName = parts[0];
		} else {
			variableName = ref;
		}
		const requireDeclaration = requireDeclarations.find((decl) => decl.variableName === variableName);
		if (requireDeclaration) {
			return false;
		}

		// Global reference detected
		this.#context.addLintingMessage(this.#resourcePath, MESSAGE.NO_GLOBALS, {
			variableName,
			namespace: ref,
		}, position);
	}

	lintPropertyBinding(bindingDefinition: string, requireDeclarations: RequireDeclaration[], position: PositionInfo) {
		try {
			const bindingInfo = this.#parseBinding(bindingDefinition);
			if (bindingInfo) {
				this.#analyzePropertyBinding(bindingInfo as PropertyBindingInfo, requireDeclarations, position);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.#context.addLintingMessage(this.#resourcePath, MESSAGE.PARSING_ERROR, {message}, position);
		}
	}

	lintAggregationBinding(
		bindingDefinition: string, requireDeclarations: RequireDeclaration[], position: PositionInfo) {
		try {
			const bindingInfo = this.#parseBinding(bindingDefinition);
			if (bindingInfo) {
				this.#analyzeAggregationBinding(bindingInfo as AggregationBindingInfo, requireDeclarations, position);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.#context.addLintingMessage(this.#resourcePath, MESSAGE.PARSING_ERROR, {message}, position);
		}
	}
}
