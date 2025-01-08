import ts from "typescript";

export function getPropertyName(node: ts.PropertyName | ts.Expression): string {
	if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
		return node.text;
	} else if (ts.isComputedPropertyName(node) && ts.isStringLiteralLike(node.expression)) {
		return node.expression.text;
	} else {
		return node.getText();
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
			return false;
		}
		const name = getPropertyName(member.name);
		if (name !== memberName) {
			return false;
		}
		if (!modifiers) {
			// No modifiers argument passed, so we match any member
			return true;
		}
		if (!ts.canHaveModifiers(member)) {
			// Only match if no modifiers are expected
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
): ts.ClassElement | undefined {
	const member = findClassMember(node, methodName);
	if (!member) {
		return undefined;
	}
	if (ts.isMethodDeclaration(member)) {
		return member;
	}
	if (ts.isPropertyDeclaration(member)) {
		if (!member.initializer) {
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
	}
	return undefined;
}

export function getIdentifierOrStringLiteralText(
	node: ts.Identifier | ts.StringLiteralLike | ts.PropertyName
): string | undefined {
	if (ts.isIdentifier(node)) {
		return node.text;
	}
	if (ts.isStringLiteralLike(node)) {
		return node.text;
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
	const properties: ts.PropertyAssignment[] = [];
	let propertiesFound = 0;
	for (const property of node.properties) {
		if (!ts.isPropertyAssignment(property)) {
			continue;
		}
		const name = getPropertyName(property.name);
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
	return properties;
}
