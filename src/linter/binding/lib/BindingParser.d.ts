export type FunctionReference = string;

export interface FilterInfo {
	path?: string;
	test?: FunctionReference;
	filters?: FilterInfo | FilterInfo[];
	condition?: FilterInfo | FilterInfo[];
	// ... more properties currently not relevant to UI5 linter
}

export interface SorterInfo {
	path?: string;
	descending?: boolean;
	group?: FunctionReference | boolean;
	comparator?: FunctionReference;
}

export interface BindingInfoBase {
	path?: string;
	model?: string;
	events?: Record<string, FunctionReference>;
	parts?: BindingInfoBase[];
}

export interface PropertyBindingInfo extends BindingInfoBase {
	formatter?: FunctionReference | FunctionReference[];
	type?: FunctionReference;
	parts?: PropertyBindingInfo[];
}

export interface AggregationBindingInfo extends BindingInfoBase {
	filters?: FilterInfo | FilterInfo[];
	sorter?: SorterInfo | SorterInfo[];
	factory?: FunctionReference;
	groupHeaderFactory?: FunctionReference;
	parts?: AggregationBindingInfo[];
}

interface ExpressionBindingToken {
	id: "IDENTIFIER" | "."; // Only the ones required for UI5 linter
	value: string;
}

export interface ExpressionBinding extends BindingInfoBase {
	tokens: ExpressionBindingToken[];
}

export type BindingInfo = PropertyBindingInfo | AggregationBindingInfo | ExpressionBinding;

interface BindingParser {
	complexParser: (
		sString: string,
		oContext: object | null,
		bUnescape?: boolean,
		bTolerateFunctionsNotFound?: boolean,
		bStaticContext?: boolean,
		bPreferContext?: boolean,
		mLocals?: Record<string, string>,
		bResolveTypesAsync?: boolean
	) => BindingInfo | string | undefined; // Might return a string when bUnescape is true
}

declare const BindingParser: BindingParser;

export default BindingParser;
