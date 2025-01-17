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
}

export interface PropertyBindingInfo extends BindingInfoBase {
	formatter?: FunctionReference;
	type?: FunctionReference;
}

export interface AggregationBindingInfo extends BindingInfoBase {
	filters?: FilterInfo | FilterInfo[];
	sorter?: SorterInfo | SorterInfo[];
	factory?: FunctionReference;
	groupHeaderFactory?: FunctionReference;
}

export type BindingInfo = PropertyBindingInfo | AggregationBindingInfo;

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
	) => BindingInfo;
}

declare const BindingParser: BindingParser;

export default BindingParser;
