import ts from "typescript";
import {getPropertyNameText} from "../linter/ui5Types/utils.js";

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

export function getIdentifierForImport(importName: string): string {
	const parts = importName.split("/");
	const identifier = parts[parts.length - 1];
	if (identifier === "jquery") {
		return "jQuery";
	}
	if (identifier === "library") {
		const potentialLibraryName = parts[parts.length - 2];

		// Relative imports contain a dot and should not be mistaken for a library name
		if (!potentialLibraryName.includes(".")) {
			return potentialLibraryName + "Library";
		} else {
			return identifier;
		}
	}
	return camelize(identifier);
}

// Camelize a string by replacing invalid identifier characters
function camelize(str: string): string {
	return str.replace(/[^\p{ID_Start}\p{ID_Continue}]+([\p{ID_Start}\p{ID_Continue}])/gu, (_match, nextChar) => {
		return typeof nextChar === "string" ? nextChar.toUpperCase() : "";
	});
}
