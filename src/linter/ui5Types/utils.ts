import ts from "typescript";

export function getPropertyName(node: ts.PropertyName | ts.Expression): string {
	if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
		return node.text;
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

export function findClassInstanceMethod(
	node: ts.ClassDeclaration, methodName: string, checker: ts.TypeChecker
): ts.ClassElement | undefined {
	return node.members.find((member) => {
		if (!member.name) {
			return false;
		}
		const name = getPropertyName(member.name);
		if (name !== methodName) {
			return false;
		}
		if (ts.isMethodDeclaration(member)) {
			return true;
		}
		if (ts.isPropertyDeclaration(member)) {
			if (!member.initializer) {
				return false;
			}
			if (ts.isFunctionExpression(member.initializer) || ts.isArrowFunction(member.initializer)) {
				return true;
			};
			if (ts.isIdentifier(member.initializer)) {
				const symbol = checker.getSymbolAtLocation(member.initializer);
				if (symbol?.valueDeclaration && ts.isFunctionDeclaration(symbol.valueDeclaration)) {
					return true;
				}
			}
		}
		return false;
	});
}
