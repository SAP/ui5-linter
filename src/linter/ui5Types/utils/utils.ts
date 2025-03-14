import ts from "typescript";
import {getUniqueName} from "./UniqueNameCreator.js";

/**
 * Returns the text of a PropertyName node.
 * This function will not return the source code text of the node, but the text that can be
 * used to check against when looking for a specific property.
 *
 * If the text can't be determined, undefined is returned.
 * This may happen in the following cases:
 * - A ComputedPropertyName with a non-string literal-like expression
 * - A BigIntLiteral, which technically is a PropertyName, but is not valid in this context
 *
 * @param node
 * @returns text of the given node or undefined
 */
export function getPropertyNameText(node: ts.PropertyName): string | undefined {
	if (
		ts.isStringLiteralLike(node) || ts.isNumericLiteral(node) || ts.isIdentifier(node) ||
		ts.isPrivateIdentifier(node)
	) {
		return node.text;
	} else if (ts.isComputedPropertyName(node) && ts.isStringLiteralLike(node.expression)) {
		return node.expression.text;
	} else {
		return undefined;
	}
}

/**
 * Searches for the symbol of a property within the given construct signatures.
 * The first match is returned.
 *
 * Returns undefined if the property is not found in any of the construct signatures.
 *
 * @param constructSignatures construct signatures to search in
 * @param argumentPosition position of the signature parameter to search in
 * @param propertyName property name to search for
 * @returns symbol of the found property or undefined
 */
export function getSymbolForPropertyInConstructSignatures(
	constructSignatures: readonly ts.Signature[],
	argumentPosition: number,
	propertyName: string
): ts.Symbol | undefined {
	for (const constructSignature of constructSignatures) {
		const propertySymbol = constructSignature
			.getTypeParameterAtPosition(argumentPosition)
			.getProperty(propertyName);
		if (propertySymbol) {
			return propertySymbol;
		}
	}
	return undefined;
}

/**
 * Searches for a class member with the given name.
 * If no modifiers are passed, any member with the given name is returned.
 * If modifiers are passed, only members with at least the given modifiers are returned.
 *
 * Returns undefined if no matching member is found.
 *
 * @param node
 * @param memberName
 * @param modifiers
 * @returns
 */
export function findClassMember(
	node: ts.ClassDeclaration, memberName: string,
	modifiers: {modifier: ts.ModifierSyntaxKind; not?: boolean}[] = []
): ts.ClassElement | undefined {
	return node.members.find((member) => {
		if (!member.name) {
			// Constructor does not have a name
			return false;
		}
		const name = getPropertyNameText(member.name);
		if (name !== memberName) {
			return false;
		}
		if (modifiers.length === 0) {
			// No modifiers passed, so we match any member
			return true;
		}
		if (!ts.canHaveModifiers(member)) {
			// Only match if no modifiers are expected.
			// This is only the case for constructor declarations, but they are already filtered out above.
			// Still, this check is here for type checking and in case new node types are added.
			return modifiers.length === 0;
		}
		return modifiers.every(({modifier, not}) => {
			const result = member.modifiers?.some(({kind}) => kind === modifier);
			return not ? !result : result;
		});
	});
}

/**
 * Checks whether the given class member is a method or function.
 * This includes the type lookup of a referenced function.
 *
 * @param node
 * @param methodName
 * @param checker
 * @returns
 */
export function isClassMethod(
	node: ts.ClassElement, checker: ts.TypeChecker
): boolean {
	if (ts.isMethodDeclaration(node)) {
		return true;
	}
	if (!ts.isPropertyDeclaration(node) || !node.initializer) {
		return false;
	}
	if (ts.isFunctionExpression(node.initializer) || ts.isArrowFunction(node.initializer)) {
		return true;
	};
	if (ts.isIdentifier(node.initializer)) {
		const symbol = checker.getSymbolAtLocation(node.initializer);
		if (symbol?.valueDeclaration && ts.isFunctionDeclaration(symbol.valueDeclaration)) {
			return true;
		}
	}
	return false;
}

/**
 * Returns the PropertyAssignment of the given property name in the given ObjectLiteralExpression.
 * If the property is not found, undefined is returned.
 *
 * @param propertyName
 * @param node
 * @returns
 */
export function getPropertyAssignmentInObjectLiteralExpression(
	propertyName: string, node: ts.ObjectLiteralExpression
): ts.PropertyAssignment | undefined {
	return getPropertyAssignmentsInObjectLiteralExpression([propertyName], node)[0];
}

/**
 * Returns the PropertyAssignments of the given property names in the given ObjectLiteralExpression.
 * The order of the returned array matches the order of the propertyNames array and may contain undefined
 * values for properties that are not found.
 *
 * @param propertyNames
 * @param node
 * @returns
 */
export function getPropertyAssignmentsInObjectLiteralExpression(
	propertyNames: string[], node: ts.ObjectLiteralExpression
): (ts.PropertyAssignment | undefined)[] {
	const properties: (ts.PropertyAssignment | undefined)[] = [];
	let propertiesFound = 0;
	for (const property of node.properties) {
		if (!ts.isPropertyAssignment(property)) {
			continue;
		}
		const name = getPropertyNameText(property.name);
		for (let i = 0; i < propertyNames.length; i++) {
			if (name === propertyNames[i] && !properties[i]) {
				properties[i] = property;
				propertiesFound++;
				if (propertiesFound === propertyNames.length) {
					return properties;
				}
			}
		}
	}
	// Fill array with undefined for missing properties
	for (let i = 0; i < propertyNames.length; i++) {
		if (!properties[i]) {
			properties[i] = undefined;
		}
	}
	return properties;
}

export function resolveUniqueName(inputName: string, existingIdentifiers?: Set<string>): string {
	const parts = inputName.split("/");
	const identifier = parts[parts.length - 1];
	let name = null;
	if (identifier === "jquery") {
		name = "jQuery";
	} else if (identifier === "library") {
		const potentialLibraryName = parts[parts.length - 2];

		// Relative imports contain a dot and should not be mistaken for a library name
		if (!potentialLibraryName.includes(".")) {
			name = potentialLibraryName + "Library";
		}
	}

	name = name ?? camelize(identifier);
	if (existingIdentifiers?.has(name)) {
		name = getUniqueName(Array.from(existingIdentifiers ?? []), inputName, "/");
	}
	return name;
}

// Camelize a string by replacing invalid identifier characters
function camelize(str: string): string {
	return str.replace(/[^\p{ID_Start}\p{ID_Continue}]+([\p{ID_Start}\p{ID_Continue}])/gu, (_match, nextChar) => {
		return typeof nextChar === "string" ? nextChar.toUpperCase() : "";
	});
}

export function isGlobalAssignment(node: ts.AccessExpression): boolean {
	let currentNode: ts.Node | undefined = node;
	while (ts.isPropertyAccessExpression(currentNode) || ts.isElementAccessExpression(currentNode)) {
		if (!currentNode.parent) {
			return false;
		}
		if (ts.isBinaryExpression(currentNode.parent)) {
			return currentNode.parent.left === currentNode &&
				currentNode.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
		}
		currentNode = currentNode.parent;
	}
	return false;
}

export function isConditionalAccess(node: ts.Node): boolean {
	const parent = node.parent;
	if (!parent) {
		return false;
	}
	switch (parent.kind) {
		case ts.SyntaxKind.IfStatement:
			return (parent as ts.IfStatement).expression === node;
		case ts.SyntaxKind.ConditionalExpression:
			return (parent as ts.ConditionalExpression).condition === node;
		case ts.SyntaxKind.BinaryExpression:
			if ((parent as ts.BinaryExpression).operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
				return true;
			}
	}

	let currentNode = node;
	while (currentNode && (ts.isPropertyAccessExpression(currentNode) || ts.isElementAccessExpression(currentNode))) {
		if (currentNode.questionDotToken) {
			return true;
		}
		currentNode = currentNode.expression;
	}

	return false;
}
