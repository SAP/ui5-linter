import ts from "typescript";
import {AmbientModuleCache} from "../AmbientModuleCache.js";
import {isConditionalAccess, isAssignment} from "../utils/utils.js";
import type {FixHints} from "./FixHints.js";

export default class GlobalsFixHintsGenerator {
	constructor(
		private resourcePath: string,
		private ambientModuleCache: AmbientModuleCache
	) {

	}

	getFixHints(node: ts.CallExpression | ts.AccessExpression): FixHints | undefined {
		if (!this.isFixable(node)) {
			return undefined;
		}

		const result = this.getImportFromGlobal(node);
		if (!result) {
			return undefined;
		}
		const {fixHints, propertyAccessNode} = result;
		if (
			fixHints.moduleName &&
			(
				this.resourcePath === `/resources/${fixHints.moduleName}.js` ||
				this.resourcePath === `/resources/${fixHints.moduleName}.ts`
			)
		) {
			// Prevent adding imports to the module itself
			return undefined;
		}

		// Check for usage of "delete" keyword with the module export, which is not fixable
		// as only an identifier would remain after the autofix, which would not be valid.
		if (
			ts.isDeleteExpression(propertyAccessNode.parent) &&
			propertyAccessNode.parent.expression === propertyAccessNode
		) {
			return undefined;
		}

		// Check whether the access is conditional / probing / lazy
		fixHints.conditional = isConditionalAccess(propertyAccessNode);

		return fixHints;
	}

	private isFixable(node: ts.CallExpression | ts.AccessExpression): boolean {
		if (ts.isCallExpression(node)) {
			return true;
		}
		if (isAssignment(node)) {
			return false;
		}
		return true;
	}

	private getImportFromGlobal(
		node: ts.CallExpression | ts.AccessExpression
	): {fixHints: FixHints; propertyAccessNode: ts.Node} | undefined {
		const parts: string[] = [];
		const partNodes: ts.Node[] = [];

		const firstPart = node.expression;
		if (!ts.isIdentifier(firstPart)) {
			return undefined;
		}

		if (firstPart.text !== "window" && firstPart.text !== "globalThis" && firstPart.text !== "self") {
			parts.push(firstPart.text);
			partNodes.push(firstPart);
		}

		let scanNode: ts.Node = node;
		while (ts.isPropertyAccessExpression(scanNode)) {
			if (!ts.isIdentifier(scanNode.name)) {
				throw new Error(
					`Unexpected PropertyAccessExpression node: Expected name to be identifier but got ` +
					ts.SyntaxKind[scanNode.name.kind]);
			}
			parts.push(scanNode.name.text);
			partNodes.push(scanNode);
			scanNode = scanNode.parent;
		}

		let moduleSymbol;
		const searchStack = [...parts];
		let exportName;
		while (!moduleSymbol && searchStack.length) {
			const moduleName = searchStack.join("/");
			if (moduleName === "sap/ui/core/Core") {
				// Special case for sap.ui.core.Core:
				// The global access provides the Core class, while the module import
				// only provides the singleton instance.
				// For now, we don't fix this case, because it is not a common pattern.
				return undefined;
			}
			// TODO: Handle global usage of jQuery/$, to be replaced with an import of sap/ui/thirdparty/jquery
			// Note that there might be more handling needed than just this code here.
			// if (moduleName === "jQuery" || moduleName === "$") {
			// 	return {
			// 		fixHints: {moduleName: "sap/ui/thirdparty/jquery", propertyAccess: searchStack.join(".")},
			// 		propertyAccessNode: partNodes[searchStack.length - 1],
			// 	};
			// }
			moduleSymbol = this.ambientModuleCache.findModuleForName(moduleName);
			if (!moduleSymbol) {
				const libraryModuleName = `${moduleName}/library`;
				moduleSymbol = this.ambientModuleCache.findModuleForName(libraryModuleName);
				if (moduleSymbol) {
					exportName = parts[searchStack.length];
					if (exportName && !this.isLibraryExportAccess(moduleSymbol, parts.slice(searchStack.length))) {
						return undefined;
					}
					return {
						fixHints: {moduleName: libraryModuleName, propertyAccess: searchStack.join(".")},
						propertyAccessNode: partNodes[searchStack.length - 1],
					};
				}
			}
			if (!moduleSymbol) {
				searchStack.pop();
			}
		}
		if (!searchStack.length) {
			return undefined;
		}
		return {
			fixHints: {moduleName: searchStack.join("/"), propertyAccess: searchStack.join(".")},
			propertyAccessNode: partNodes[searchStack.length - 1],
		};
	}

	private isLibraryExportAccess(moduleSymbol: ts.Symbol, parts: string[]) {
		// Check for access of unknown/private export or a global usage without a corresponding module
		// e.g. when defining a shortcut for a sub-namespace like sap.ui.core.message
		let currentSymbol: ts.Symbol | undefined = moduleSymbol;
		let currentPart;
		while (parts.length) {
			currentPart = parts.shift();
			currentSymbol = currentSymbol.exports?.get(currentPart as ts.__String);
			if (!currentSymbol) {
				return false;
			}
			// Only continue when symbol is a namespace, as only those have exports we want to check for
			if (!(currentSymbol.flags & ts.SymbolFlags.Namespace)) {
				return true;
			}
		}
		return true;
	}
}
