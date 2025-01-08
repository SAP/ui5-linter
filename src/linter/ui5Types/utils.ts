import ts from "typescript";

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

export function findClassMember(
	node: ts.ClassDeclaration, memberName: string, modifiers?: ts.ModifierSyntaxKind[]
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
		if (!modifiers) {
			// No modifiers argument passed, so we match any member
			return true;
		}
		if (!ts.canHaveModifiers(member)) {
			// Only match if no modifiers are expected.
			// This is only the case for constructor declarations, but they are already filtered out above.
			// Still, this check is here for type checking and in case new node types are added.
			return modifiers.length === 0;
		}
		return modifiers.every((modifier) => {
			return member.modifiers?.some((nodeModifier) => {
				return nodeModifier.kind === modifier;
			});
		});
	});
}

export function findClassInstanceMethod(
	node: ts.ClassDeclaration, methodName: string, checker: ts.TypeChecker
): ts.MethodDeclaration | ts.PropertyDeclaration | undefined {
	const member = findClassMember(node, methodName);
	if (!member) {
		return undefined;
	}
	if (ts.isMethodDeclaration(member)) {
		return member;
	}
	if (!ts.isPropertyDeclaration(member) || !member.initializer) {
		return undefined;
	}
	if (ts.isFunctionExpression(member.initializer) || ts.isArrowFunction(member.initializer)) {
		return member;
	};
	if (ts.isIdentifier(member.initializer)) {
		const symbol = checker.getSymbolAtLocation(member.initializer);
		if (symbol?.valueDeclaration && ts.isFunctionDeclaration(symbol.valueDeclaration)) {
			return member;
		}
	}
	return undefined;
}

export function getPropertyAssignmentInObjectLiteralExpression(
	propertyName: string, node: ts.ObjectLiteralExpression
): ts.PropertyAssignment | undefined {
	return getPropertyAssignmentsInObjectLiteralExpression([propertyName], node)[0];
}

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
