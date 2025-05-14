import ts from "typescript";

export interface FixMetadata {
	moduleName?: string;
	nodeType: ts.Node;
}