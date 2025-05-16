import ts from "typescript";
import {getPropertyNameText} from "../linter/ui5Types/utils/utils.js";

export function resolveNamespace(node: ts.AccessExpression | ts.CallExpression): string | undefined {
	const firstPart = node.expression;
	const parts: string[] = [];
	if (!ts.isIdentifier(firstPart)) {
		if (!ts.isCallExpression(firstPart)) {
			return undefined;
		}
	} else {
		if (firstPart.text !== "window" && firstPart.text !== "globalThis" && firstPart.text !== "self") {
			parts.push(firstPart.text);
		}
	}

	let scanNode: ts.Node = node;
	while (ts.isPropertyAccessExpression(scanNode)) {
		if (!ts.isIdentifier(scanNode.name)) {
			throw new Error(
				`Unexpected PropertyAccessExpression node: Expected name to be identifier but got ` +
				ts.SyntaxKind[scanNode.name.kind]);
		}
		parts.push(scanNode.name.text);
		scanNode = scanNode.parent;
	}

	return parts.join(".");
}

export function findGreatestAccessExpression(node: ts.Identifier, matchPropertyAccess?: string):
	ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression {
	type Candidate = ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
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

interface FixRange {
	start: number;
	end: number;
	fix: Fix;
}

export function removeConflictingFixes(fixes: Set<Fix>) {
	const fixRanges: FixRange[] = [];
	for (const fix of fixes) {
		const ranges = fix.getAffectedSourceCodeRange();
		if (Array.isArray(ranges)) {
			for (const range of ranges) {
				fixRanges.push({
					start: range.start,
					end: range.end,
					fix: fix,
				});
			}
		} else {
			const {start, end} = ranges;
			fixRanges.push({
				start,
				end,
				fix: fix,
			});
		}
	}

	if (fixRanges.length === 0) return [];

	// Sort fixRanges by start position; if start is the same, sort by end position
	fixRanges.sort((a, b) => a.start - b.start || a.end - b.end);

	let currentEnd = fixRanges[0].end;

	for (let i = 1; i < fixRanges.length; i++) {
		const fixRange = fixRanges[i];

		if (fixRange.start < currentEnd) {
			// Conflict
			fixes.delete(fixRange.fix);
		}

		currentEnd = Math.max(currentEnd, fixRange.end);
	}
}
