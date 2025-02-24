import ts from "typescript";
import {getPropertyNameText} from "../linter/ui5Types/utils.js";
import pruneNode from "../linter/ui5Types/amdTranspiler/pruneNode.js";
import {toPosStr} from "../linter/ui5Types/amdTranspiler/util.js";

export function findGreatestAccessExpression(node: ts.Identifier, matchPropertyAccess?: string):
	ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression {
	type Candidate = ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
	let scanNode: Candidate = node;
	let propertyAccessChain: string[] = [];
	if (matchPropertyAccess) {
		propertyAccessChain = matchPropertyAccess.split(".");
		if (node.text !== "window") {
			const firstPropAccess = propertyAccessChain.shift();
			if (node.text !== firstPropAccess) {
				throw new Error(`Expected node to be ${firstPropAccess} but got ${node.getText()}`);
			}
		}
	}
	while (ts.isPropertyAccessExpression(scanNode.parent) || ts.isElementAccessExpression(scanNode.parent)) {
		scanNode = scanNode.parent;
		if (matchPropertyAccess) {
			const nextPropertyAccess = propertyAccessChain.shift();

			let propName;
			if (ts.isPropertyAccessExpression(scanNode)) {
				propName = getPropertyNameText(scanNode.name);
			} else {
				if (
					ts.isStringLiteralLike(scanNode.argumentExpression) ||
					ts.isNumericLiteral(scanNode.argumentExpression)
				) {
					propName = scanNode.argumentExpression.text;
				} else {
					propName = scanNode.argumentExpression.getText();
				}
			}
			if (propName !== nextPropertyAccess) {
				throw new Error(`Expected node to be ${nextPropertyAccess} but got ${propName}`);
			}
			if (!propertyAccessChain.length) {
				return scanNode;
			}
		}
	}
	return scanNode;
}

export function matchPropertyAccessExpression(node: ts.PropertyAccessExpression, match: string): boolean {
	const propAccessChain: string[] = [];
	propAccessChain.push(node.expression.getText());

	let scanNode: ts.Node = node;
	while (ts.isPropertyAccessExpression(scanNode)) {
		propAccessChain.push(scanNode.name.getText());
		scanNode = scanNode.parent;
	}
	return propAccessChain.join(".") === match;
}

export function getImportForNamespace(namespace: string): string {
	namespace = namespace.replace(/^(?:window|globalThis|self)./, "");
	if (namespace.startsWith("sap.")) {
		if (namespace === "sap.ui.getCore") {
			return "sap/ui/core/Core";
		}
		return namespace.replaceAll(".", "/");
	} else if (namespace === "jQuery") {
		return "sap/ui/thirdparty/jquery";
	} else {
		throw new Error(`Unsupported namespace ${namespace}`);
	}
}

// export function getImportForGlobalVariable(globalVariableName: string, namespace: string): string {
// 	namespace = namespace.replace(/^(?:window|globalThis|self)./, "");
// 	switch (globalVariableName) {
// 		case "sap":
// 			if (!namespace.startsWith("sap.")) {
// 				throw new Error(`Unsupported namespace ${namespace}`);
// 			}
// 			if (namespace === "sap.ui.getCore") {
// 				return "sap/ui/core/Core";
// 			}
// 			return namespace.replaceAll(".", "/");
// 		case "jQuery":
// 			return "sap/ui/thirdparty/jquery";
// 		default:
// 			throw new Error(`Unsupported global variable ${globalVariableName}`);
// 	}
// }

export function getIdentifierForImport(importName: string): string {
	const parts = importName.split("/");
	const identifier = parts[parts.length - 1];
	if (identifier === "jquery") {
		return "jQuery";
	}
	if (identifier === "library") {
		return parts[parts.length - 2] + "Library";
	}
	return identifier;
}

export function getFirstArgument(callExp: ts.CallExpression): string {
	const firstArg = callExp.arguments[0];
	if (!firstArg) {
		throw new UnsupportedFinding(`Missing extends argument at ${toPosStr(callExp)}`);
	}
	if (firstArg && !ts.isStringLiteralLike(firstArg)) {
		throw new UnsupportedFinding(`Unexpected extends argument of type ${ts.SyntaxKind[firstArg.kind]} at ` +
			toPosStr(firstArg));
	}
	return firstArg.text;
}

export function getDeletableNode(node: ts.Node): ts.Node | undefined {
	return pruneNode(node);
}

export class UnsupportedFinding extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}
