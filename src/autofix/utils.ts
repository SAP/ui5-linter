import ts from "typescript";
import {getPropertyNameText} from "../linter/ui5Types/utils/utils.js";

export function findGreatestAccessExpression(node: ts.Identifier, matchPropertyAccess?: string):
	ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression {
	type Candidate = ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression | ts.CallExpression;
	let scanNode: Candidate = node;
	let propertyAccessChain: string[] = [];
	if (matchPropertyAccess) {
		propertyAccessChain = matchPropertyAccess.split(".");
		if (node.text !== "window" && node.text !== "globalThis" && node.text !== "self") {
			const firstPropAccess = propertyAccessChain.shift();
			if (node.text !== firstPropAccess) {
				throw new Error(`Expected node to be ${firstPropAccess} but got ${node.getText()}`);
			}
			if (!propertyAccessChain.length) {
				return scanNode;
			}
		}
	}

	const returnType = (node: Candidate) => {
		if (!ts.isCallExpression(node)) {
			return node;
		} else if (
			ts.isPropertyAccessExpression(node.expression) ||
			ts.isIdentifier(node.expression) ||
			ts.isElementAccessExpression(node.expression)) {
			return node.expression;
		} else {
			throw new Error("Expected node to be a property access expression or identifier");
		}
	};

	while (ts.isPropertyAccessExpression(scanNode.parent) ||
		ts.isElementAccessExpression(scanNode.parent) ||
		(ts.isCallExpression(scanNode.parent) &&
			// Do not go above the actual call if wrapped in another call
			ts.isPropertyAccessExpression(scanNode.parent.expression) &&
			scanNode.parent.expression.name === node)) {
		scanNode = scanNode.parent;
		if (matchPropertyAccess) {
			const nextPropertyAccess = propertyAccessChain.shift();

			while (ts.isCallExpression(scanNode) &&
				(ts.isPropertyAccessExpression(scanNode.parent) ||
					ts.isElementAccessExpression(scanNode.parent) ||
					ts.isPropertyAccessExpression(scanNode.parent))) {
				scanNode = scanNode.parent;
			}

			let propName;
			if (ts.isPropertyAccessExpression(scanNode)) {
				propName = getPropertyNameText(scanNode.name);
			} else if (!ts.isCallExpression(scanNode)) {
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
				return returnType(scanNode);
			}
		}
	}

	return returnType(scanNode);
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

export function collectIdentifiers(node: ts.SourceFile) {
	const declaredIdentifiers = new Set<string>();
	const extractDestructIdentifiers = (name: ts.BindingName, identifiers: Set<string>) => {
		if (ts.isIdentifier(name)) {
			identifiers.add(name.text);
		} else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
			for (const element of name.elements) {
				if (ts.isBindingElement(element)) {
					extractDestructIdentifiers(element.name, identifiers);
				}
			}
		}
	};
	const collectIdentifiers = (node: ts.Node) => {
		if (
			ts.isVariableDeclaration(node) ||
			ts.isFunctionDeclaration(node) ||
			ts.isClassDeclaration(node)
		) {
			if (node.name && ts.isIdentifier(node.name)) {
				declaredIdentifiers.add(node.name.text);
			}
		}

		if (ts.isParameter(node) || ts.isVariableDeclaration(node)) {
			extractDestructIdentifiers(node.name, declaredIdentifiers);
		}

		ts.forEachChild(node, collectIdentifiers);
	};

	ts.forEachChild(node, collectIdentifiers);

	return declaredIdentifiers;
}
