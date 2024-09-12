import ts from "typescript";

export function getPropertyName(node: ts.PropertyName | ts.Expression): string {
	if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
		return node.text;
	} else {
		return node.getText();
	}
}
