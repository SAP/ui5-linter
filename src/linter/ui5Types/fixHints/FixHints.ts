import ts from "typescript";

export type FixHintsArgsType = {
	value: string;
	kind: ts.SyntaxKind;
}[];
export interface FixHints {
	/**
	 * New module name to import from
	 */
	moduleName?: string;

	/**
	 * Name of the export to be used (based on the newly imported module)
	 * e.g. for moduleName "sap/base/i18n/ResourceBundle" the exportNameToBeUsed is "create"
	 */
	exportNameToBeUsed?: string;

	/**
	 * Code to be replaced
	 * In some cases the replacement is not a module import but could be a native API,
	 * or a different function with different arguments.
	 */
	exportCodeToBeUsed?: string | {
		name: string;
		solutionLength: number;
		moduleNameIdentifier?: string;
		args?: FixHintsArgsType;
	};

	/**
	 * String representation of the property access to be replaced
	 */
	propertyAccess?: string;

	/**
	 * Whether the access is conditional / probing / lazy
	 * e.g. `if (window.sap.ui.layout) { ... }`
	 */
	conditional?: boolean;
}
