import ts from "typescript";
import type {ApiExtract} from "../../utils/ApiExtract.js";
import {getPropertyNameText} from "./utils/utils.js";

export enum Ui5TypeInfoKind {
	Module,
	Class,
	Namespace,
	ManagedObjectSettings,
	MetadataProperty,
	MetadataEvent,
	MetadataAggregation,
	MetadataAssociation,
	Constructor,
	Function,
	Method,
	Property,
	StaticMethod,
	StaticProperty,
	Enum,
	EnumMember,
}

export type Ui5TypeInfo = Ui5ModuleTypeInfo | Ui5ClassTypeInfo | Ui5NamespaceTypeInfo |
	Ui5MetadataTypeInfo | Ui5ConstructorTypeInfo | Ui5FunctionTypeInfo | Ui5MethodTypeInfo | Ui5PropertyTypeInfo |
	Ui5EnumTypeInfo | Ui5EnumMemberTypeInfo | Ui5ManagedObjectSettingsTypeInfo;

interface BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind;
}

interface Ui5ModuleTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Module;
	name: string; // module name (e.g. "sap/ui/core/Control")
	library: string; // e.g. "sap.ui.core"
}

interface Ui5NamespaceTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Namespace;
	name: string;
	parent?: Ui5NamespaceTypeInfo | Ui5ModuleTypeInfo;
}

interface Ui5ClassTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Class;
	name: string; // e.g. "sap.ui.core.Control"
	parent: Ui5NamespaceTypeInfo | Ui5ModuleTypeInfo;
}

interface Ui5ManagedObjectSettingsTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.ManagedObjectSettings;
	name: string; // e.g. "$ButtonSettings"
	parent: Ui5NamespaceTypeInfo | Ui5ModuleTypeInfo;
}

interface Ui5MetadataTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.MetadataProperty | Ui5TypeInfoKind.MetadataEvent |
		Ui5TypeInfoKind.MetadataAggregation | Ui5TypeInfoKind.MetadataAssociation;
	name: string;
	parent: Ui5ManagedObjectSettingsTypeInfo;
}

interface Ui5ConstructorTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Constructor;
	parent: Ui5ClassTypeInfo;
}

interface Ui5FunctionTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Function;
	name: string; // e.g. "getCore"
	parent: Ui5NamespaceTypeInfo | Ui5ModuleTypeInfo;
}

interface Ui5MethodTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Method | Ui5TypeInfoKind.StaticMethod;
	name: string;
	parent: Ui5ClassTypeInfo;
}

interface Ui5PropertyTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Property | Ui5TypeInfoKind.StaticProperty;
	name: string;
	parent: Ui5ClassTypeInfo;
}

interface Ui5EnumTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.Enum;
	name: string; // e.g. "HistoryDirection"
	parent: Ui5NamespaceTypeInfo | Ui5ModuleTypeInfo;
}

interface Ui5EnumMemberTypeInfo extends BaseUi5TypeInfo {
	kind: Ui5TypeInfoKind.EnumMember;
	name: string; // e.g. "Forwards"
	parent: Ui5EnumTypeInfo;
}

function isManagedObjectSettingsInterfaceName(name: string): boolean {
	// This check is based on the naming convention when generating the Interface for ManagedObject settings:
	// $<ClassName>Settings
	return name.startsWith("$") && name.endsWith("Settings") && name.length > 9;
}

function isInterfaceInheritingFromManagedObjectSettings(node: ts.InterfaceDeclaration): boolean {
	if (!node.heritageClauses) {
		return false;
	}

	if (!isManagedObjectSettingsInterfaceName(node.name.text)) {
		return false;
	}
	return true;
}

function getLibraryNameFromSourceFile(
	sourceFile: ts.SourceFile
): string {
	const fileName = sourceFile.fileName;
	const match = /(?:^|\/)([a-zA-Z0-9.]+)\.d\.ts$/.exec(fileName);
	if (match?.[1]) {
		return match[1];
	}
	return fileName.replace(/\.d\.ts$/, "");
}

/**
 * Extracts module / global type information from UI5 symbols.
 */
export function getUi5TypeInfoFromSymbol(
	symbol: ts.Symbol,
	apiExtract: ApiExtract
): Ui5TypeInfo | undefined {
	if (!symbol.valueDeclaration) {
		return undefined;
	}
	const sourceFile = symbol.valueDeclaration.getSourceFile();
	if (!sourceFile) {
		// All symbols need to have a source file
		// as we are extracting the library name from the .d.ts filename
		return undefined;
	}
	const node = symbol.valueDeclaration;
	let currentNode: ts.Declaration = symbol.valueDeclaration;
	let currentNamespaceTypeInfo: Ui5NamespaceTypeInfo | undefined;
	let namespaceTypeInfo: Ui5NamespaceTypeInfo | undefined;

	let moduleName: string | undefined;
	while (currentNode) {
		if (ts.isModuleDeclaration(currentNode)) {
			if (currentNode.flags & ts.NodeFlags.Namespace) {
				const newNamespace: Ui5NamespaceTypeInfo = {
					kind: Ui5TypeInfoKind.Namespace,
					name: currentNode.name.text,
				};
				if (currentNamespaceTypeInfo) {
					currentNamespaceTypeInfo.parent = newNamespace;
				} else {
					namespaceTypeInfo = newNamespace;
				}
				currentNamespaceTypeInfo = newNamespace;
			} else if (currentNode.parent && ts.isSourceFile(currentNode.parent)) {
				// Only consider top-level module declarations
				moduleName = currentNode.name.text;
				break;
			}
		} else if (ts.isInterfaceDeclaration(currentNode) &&
			currentNode.name.text === "JQuery"
		) {
			moduleName = "jQuery";
		}
		currentNode = currentNode.parent as ts.Declaration;
	}

	const libraryName = getLibraryNameFromSourceFile(sourceFile);

	let leafNode: Ui5NamespaceTypeInfo | Ui5ModuleTypeInfo | undefined;
	if (namespaceTypeInfo) {
		leafNode = namespaceTypeInfo;
	}
	if (moduleName) {
		const moduleNode: Ui5ModuleTypeInfo = {
			kind: Ui5TypeInfoKind.Module,
			name: moduleName,
			library: libraryName,
		};
		if (!namespaceTypeInfo) {
			leafNode = moduleNode;
		} else {
			namespaceTypeInfo.parent = moduleNode;
		}
	}

	if (!leafNode) {
		// No module or namespace found, ignore
		return;
	}

	let currentTypeInfo: Ui5TypeInfo | undefined;
	if (moduleName) {
		currentTypeInfo ??= createMangedObjectSettingsTypeInfo(node, moduleName, leafNode, apiExtract);
	}
	currentTypeInfo ??= createClassTypeInfo(node, leafNode);
	currentTypeInfo ??= createEnumMemberTypeInfo(node, leafNode);
	currentTypeInfo ??= createFunctionTypeInfo(node, leafNode);
	return currentTypeInfo;
}

export function getModuleTypeInfo(node: Ui5TypeInfo): Ui5ModuleTypeInfo | undefined {
	if (node.kind === Ui5TypeInfoKind.Module) {
		return node;
	}
	while (node.parent) {
		if (node.parent.kind === Ui5TypeInfoKind.Module) {
			return node.parent;
		}
		node = node.parent;
	}
	return undefined;
}

export function getNamespace(node: Ui5TypeInfo): string | undefined {
	let namespace;
	while (node) {
		if (node.kind === Ui5TypeInfoKind.Namespace) {
			namespace = node.name + (namespace ? "." + namespace : "");
		}
		if ("parent" in node && node.parent) {
			node = node.parent;
		} else {
			break;
		}
	}
	return namespace;
}

function createMangedObjectSettingsTypeInfo(node: ts.Declaration, moduleName: string,
	parent: Ui5ModuleTypeInfo | Ui5NamespaceTypeInfo,
	apiExtract: ApiExtract): Ui5MetadataTypeInfo | undefined {
	if (ts.isPropertySignature(node)) {
		// Potentially a UI5 metadata property in a constructor call
		const parentNode = node.parent;
		if (ts.isInterfaceDeclaration(parentNode) && isInterfaceInheritingFromManagedObjectSettings(parentNode)) {
			// This is a UI5 metadata property
			const className = moduleName.replace(/\//g, ".");
			const name = getPropertyNameText(node.name);
			if (className && name) {
				let kind: Ui5TypeInfoKind | undefined = undefined;
				if (apiExtract.isProperty(className, name)) {
					kind = Ui5TypeInfoKind.MetadataProperty;
				} else if (apiExtract.isAggregation(className, name)) {
					kind = Ui5TypeInfoKind.MetadataAggregation;
				} else if (apiExtract.isAssociation(className, name)) {
					kind = Ui5TypeInfoKind.MetadataAssociation;
				} else if (apiExtract.isEvent(className, name)) {
					kind = Ui5TypeInfoKind.MetadataEvent;
				} // else: Special settings, etc.
				if (kind) {
					return {
						kind,
						name,
						parent: {
							kind: Ui5TypeInfoKind.ManagedObjectSettings,
							name: parentNode.name.text,
							parent,
						},
					};
				}
			}
		}
	}
}

function createClassTypeInfo(node: ts.Declaration, parent: Ui5ModuleTypeInfo | Ui5NamespaceTypeInfo):
	Ui5ConstructorTypeInfo | Ui5MethodTypeInfo | Ui5PropertyTypeInfo | Ui5ClassTypeInfo | undefined {
	if (ts.isClassDeclaration(node) && node.name) {
		return {
			kind: Ui5TypeInfoKind.Class,
			name: node.name.text,
			parent,
		};
	}
	if (!ts.isInterfaceDeclaration(node.parent) && !ts.isClassDeclaration(node.parent)) {
		return;
	}
	if (!node.parent.name) {
		// Class name can be undefined in `export default class { ... }`. But we generally don't expect
		// to encounter this case in the UI5 types so we can safely ignore it and keeps our types greedy.
		return;
	}
	const classTypeInfo: Ui5ClassTypeInfo = {
		kind: Ui5TypeInfoKind.Class,
		name: node.parent.name.text,
		parent,
	};

	if (ts.isConstructorDeclaration(node)) {
		// TODO: Difference between interface and class?
		return {
			kind: Ui5TypeInfoKind.Constructor,
			parent: classTypeInfo,
		};
	}

	if (ts.isMethodSignature(node) || ts.isMethodDeclaration(node)) {
		const name = getPropertyNameText(node.name);
		if (!name) {
			// We need a name for methods and properties
			return undefined;
		}
		return {
			kind: hasStaticModifier(node) ? Ui5TypeInfoKind.StaticMethod : Ui5TypeInfoKind.Method,
			name,
			parent: classTypeInfo,
		};
	}
	if (ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) {
		const name = getPropertyNameText(node.name);
		if (!name) {
			// We need a name for methods and properties
			return undefined;
		}
		return {
			kind: hasStaticModifier(node) ? Ui5TypeInfoKind.StaticProperty : Ui5TypeInfoKind.Property,
			name,
			parent: classTypeInfo,
		};
	}
}

function createEnumTypeInfo(node: ts.EnumDeclaration, parent: Ui5ModuleTypeInfo | Ui5NamespaceTypeInfo):
	Ui5EnumTypeInfo | undefined {
	if (!ts.isEnumDeclaration(node)) {
		return;
	}
	return {
		kind: Ui5TypeInfoKind.Enum,
		name: node.name.text,
		parent,
	};
}

function createEnumMemberTypeInfo(node: ts.Declaration, parent: Ui5ModuleTypeInfo | Ui5NamespaceTypeInfo):
	Ui5EnumTypeInfo | Ui5EnumMemberTypeInfo | undefined {
	if (ts.isEnumDeclaration(node)) {
		return createEnumTypeInfo(node, parent);
	}
	if (!ts.isEnumMember(node)) {
		return;
	}
	const enumTypeInfo = createEnumTypeInfo(node.parent, parent);
	if (!enumTypeInfo) {
		return;
	}
	const name = getPropertyNameText(node.name);
	if (!name) {
		// We need a name for enum members
		return;
	}
	return {
		kind: Ui5TypeInfoKind.EnumMember,
		name,
		parent: enumTypeInfo,
	};
}

function createFunctionTypeInfo(node: ts.Declaration, parent: Ui5ModuleTypeInfo | Ui5NamespaceTypeInfo):
	Ui5FunctionTypeInfo | undefined {
	if (!ts.isFunctionDeclaration(node) && !ts.isFunctionExpression(node) && !ts.isArrowFunction(node)) {
		return;
	}
	if (!node.name) {
		// Ignore anonymous functions
		return;
	}
	return {
		kind: Ui5TypeInfoKind.Function,
		name: node.name.text,
		parent,
	};
}

function hasStaticModifier(node: ts.Node) {
	if (!ts.canHaveModifiers(node)) {
		return false;
	}
	return ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);
}
