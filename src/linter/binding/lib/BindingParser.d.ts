export interface BindingInfo {
	path?: string;
	model?: string;
	formatter?: string;
	events?: Record<string, string>;
}

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
