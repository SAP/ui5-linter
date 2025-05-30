import ts from "typescript";
import {loadApiExtract} from "../../utils/ApiExtract.js";
import {getSymbolModuleDeclaration} from "./utils/utils.js";

export enum Ui5TypeInfoKind {
	Global,
	Module,
	Library,
	MetadataProperty,
	MetadataEvent,
	MetadataAggregation,
	MetadataAssociation,
	Method,
	Property,
	StaticMethod,
	StaticProperty,
}

export type Ui5TypeInfo = Ui5ModuleTypeInfo | Ui5GlobalTypeInfo | Ui5LibraryTypeInfo |
	Ui5MetadataTypeInfo | Ui5MethodTypeInfo | Ui5PropertyTypeInfo;

interface BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind;
}

interface Ui5GlobalTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Global;
	namespace: string;
}

interface Ui5LibraryTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Library;
	name: string; // e.g. "sap.ui.core", extracted from the .d.ts filename
}

interface Ui5ModuleTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Module;
	module: string; // module name (slash separated)
	name?: string; // e.g. DataType name ???
	library: Ui5LibraryTypeInfo;
}

interface Ui5MetadataTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.MetadataProperty | Ui5TypeInfoKind.MetadataEvent |
		Ui5TypeInfoKind.MetadataAggregation | Ui5TypeInfoKind.MetadataAssociation;
	name: string;
	className: string; // e.g. "sap.ui.core.Control"
}

interface Ui5MethodTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Method | Ui5TypeInfoKind.StaticMethod;
	name: string;
	module: Ui5ModuleTypeInfo;
}

interface Ui5PropertyTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Property | Ui5TypeInfoKind.StaticProperty;
	name: string;
	module: Ui5ModuleTypeInfo;
}

// TODO: Use an actual type check for this, e.g. by getting the actual MO settings interface declaration
// and using checker.isTypeAssignableTo
function isInterfaceInheritingFromManagedObjectSettings(node: ts.InterfaceDeclaration): boolean {
	if (!node.heritageClauses) {
		return false;
	}
	for (const clause of node.heritageClauses) {
		if (clause.token !== ts.SyntaxKind.ExtendsKeyword) {
			continue;
		}
		for (const type of clause.types) {
			if (!ts.isIdentifier(type.expression)) {
				return false;
			}
			switch (type.expression.text) {
				case "$ControlSettings":
				case "$ElementSettings":
				case "$ManagedObjectSettings":
					return true;
			}
		}
	}
	return false;
}

// TODO: Re-use the existing shared instance
const apiExtract = await loadApiExtract();

/**
 * Extracts module / global type information from UI5 symbols.
 */
export function getUi5TypeInfoFromSymbol(
	symbol: ts.Symbol
): Ui5TypeInfo | undefined {
	if (!symbol.valueDeclaration) {
		return undefined;
	}
	let currentNode: ts.Node = symbol.valueDeclaration;
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
		if (ts.isPropertySignature(symbol.valueDeclaration)) {
			// Potentially a UI5 metadata property in a constructor call
			const parent = symbol.valueDeclaration.parent;
			if (ts.isInterfaceDeclaration(parent) && isInterfaceInheritingFromManagedObjectSettings(parent)) {
				// This is a UI5 metadata property
				const className = module.replace(/\//g, ".");
				if (className) {
					let kind: Ui5TypeInfoKind | undefined = undefined;
					if (apiExtract.isProperty(className, name)) {
						kind = Ui5TypeInfoKind.MetadataProperty;
					} else if (apiExtract.isAggregation(className, name)) {
						kind = Ui5TypeInfoKind.MetadataAggregation;
					} else if (apiExtract.isAssociation(className, name)) {
						kind = Ui5TypeInfoKind.MetadataAssociation;
					} else if (apiExtract.isEvent(className, name)) {
						kind = Ui5TypeInfoKind.MetadataEvent;
					}
					if (kind) {
						return {
							kind,
							name,
							className,
						};
					}
				}
			}
		}

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
