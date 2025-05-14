import ts from "typescript";
import {FixMetadata} from "./FixMetadata.js";
import FixJquerySapLog from "./FixJquerySapLog.js";
import Fix from "./Fix.js";

export function createDeprecatedCallExpressionFix(node: ts.CallExpression) {
	console.log(node);
	
}

export function createDeprecatedPropertyAccessFix(node: ts.AccessExpression) {
	console.log(node);

}
export function createGlobalPropertyAccessFix(node: ts.AccessExpression) {
	console.log(node);
	
}

export function createJquerySapCallExpressionFix(node: ts.CallExpression) {
	console.log(node);

}
export function createJquerySapAccessExpressionFix(node: ts.AccessExpression) {
	// Check all classes
	const fix = FixJquerySapLog.create(node);
	if (fix) {
		return fix;
	}

	// const parts: string[] = [];
	// const partNodes: ts.Node[] = [];
	// let isJQueryFnAccess = false;

	// const firstPart = node.expression;
	// if (!ts.isIdentifier(firstPart)) {
	// 	if (!ts.isCallExpression(firstPart)) {
	// 		return undefined;
	// 	}
	// 	if (ts.isIdentifier(firstPart.expression) &&
	// 		["jQuery", "$"].includes(firstPart.expression.text)) {
	// 		isJQueryFnAccess = true;
	// 	} else {
	// 		return undefined;
	// 	}
	// } else {
	// 	if (firstPart.text !== "window" && firstPart.text !== "globalThis" && firstPart.text !== "self") {
	// 		parts.push(firstPart.text);
	// 		partNodes.push(firstPart);
	// 	}
	// }
	// let scanNode: ts.Node = node;
	// while (ts.isPropertyAccessExpression(scanNode)) {
	// 	if (!ts.isIdentifier(scanNode.name)) {
	// 		throw new Error(
	// 			`Unexpected PropertyAccessExpression node: Expected name to be identifier but got ` +
	// 			ts.SyntaxKind[scanNode.name.kind]);
	// 	}
	// 	parts.push(scanNode.name.text);
	// 	partNodes.push(scanNode);
	// 	scanNode = scanNode.parent;
	// }

	// let moduleReplacement;
	// const searchStack = [...parts];
	// while (!moduleReplacement && searchStack.length) {
	// 	if (isJQueryFnAccess) {
	// 		// jQuery.fn.methodName
	// 		moduleReplacement = jQueryPluginReplacements.get(searchStack.join("."));
	// 	} else if (["jQuery", "$"].includes(searchStack[0]) && searchStack[1] === "sap") {
	// 		moduleReplacement = jQuerySapModulesReplacements.get(searchStack.slice(2).join("."));
	// 	} else if (["jQuery", "$"].includes(searchStack[0])) {
	// 		if (searchStack.length > 1) {
	// 			moduleReplacement = jQueryReplacements.get(searchStack.slice(1).join("."));
	// 		}
	// 	}
	// 	if (!moduleReplacement) {
	// 		searchStack.pop();
	// 	}
	// }

	// createFix(node);
}
