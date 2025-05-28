import ts from "typescript";

export enum Ui5TypeInfoKind {
	Module,
	Global,
}

export type Ui5TypeInfo = Ui5ModuleTypeInfo | Ui5GlobalTypeInfo;

interface Ui5ModuleTypeInfo {
	module: string; // module name (slash separated)
	export: string; // complete export name with namespaces
	basename?: string; // local name without namespaces
	name?: string; // e.g. DataType name
	kind: Ui5TypeInfoKind.Module;
}

interface Ui5GlobalTypeInfo {
	namespace: string;
	kind: Ui5TypeInfoKind.Global;
}

/**
 * Extracts module / global type information from UI5 symbols.
 */
export function getUi5TypeInfoFromSymbol(symbol: ts.Symbol): Ui5TypeInfo | undefined {
	let currentNode: ts.Node | undefined = symbol.valueDeclaration;
	if (!currentNode) {
		return undefined;
	}
	const name = symbol.name;
	let module: string | undefined;
	const namespace = [];
	while (currentNode) {
		if (ts.isModuleDeclaration(currentNode)) {
			if (currentNode.flags & ts.NodeFlags.Namespace) {
				namespace.unshift(currentNode.name.text);
			} else if (currentNode.parent && ts.isSourceFile(currentNode.parent)) {
				// Only consider top-level module declarations
				module = currentNode.name.text;
				break;
			}
		} else if (ts.isInterfaceDeclaration(currentNode) &&
			currentNode.name.text === "JQuery"
		) {
			module = "jQuery";
		}
		currentNode = currentNode.parent;
	}
	if (module) {
		const info: Ui5ModuleTypeInfo = {
			kind: Ui5TypeInfoKind.Module,
			module,
			export: namespace.length ? (namespace.join(".") + "." + name) : name,
			basename: name,
		};
		return info;
	} else {
		namespace.push(name);
		return {
			kind: Ui5TypeInfoKind.Global,
			namespace: namespace.join("."),
		};
	}
}
