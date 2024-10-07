import ts from "typescript";
import {toPosStr} from "./util.js";

export class UnsupportedExtendCall extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

/**
 * Rewrite a UI5-typical `Class.extend("MyClass", {})` CallExpression to a ClassDeclaration
 */
export default function rewriteExtendCall(nodeFactory: ts.NodeFactory,
	callExp: ts.CallExpression, modifiers?: ts.ModifierLike[],
	className?: string | ts.Identifier): ts.ClassDeclaration {
	if (!(ts.isPropertyAccessExpression(callExp.expression) && ts.isIdentifier(callExp.expression.name) &&
		callExp.expression.name.text === "extend")) {
		throw new UnsupportedExtendCall(`Not a UI5 Class#extends call ${toPosStr(callExp.expression)}`);
	}
	if (!className) {
		className = nodeFactory.createUniqueName(getClassNameFromArguments(callExp));
	}
	const body = getClassBodyFromArguments(nodeFactory, callExp);
	return nodeFactory.createClassDeclaration(modifiers,
		className,
		undefined,
		[nodeFactory.createHeritageClause(
			ts.SyntaxKind.ExtendsKeyword,
			[nodeFactory.createExpressionWithTypeArguments(
				callExp.expression.expression, undefined
			)]
		)],
		body);
}

function getClassNameFromArguments(callExp: ts.CallExpression): string {
	const firstArg = callExp.arguments[0];
	if (!firstArg) {
		throw new UnsupportedExtendCall(`Missing extends argument at ${toPosStr(callExp)}`);
	}
	if (firstArg && !ts.isStringLiteralLike(firstArg)) {
		throw new UnsupportedExtendCall(`Unexpected extends argument of type ${ts.SyntaxKind[firstArg.kind]} at ` +
			toPosStr(firstArg));
	}
	// Just like OpenUI5's ObjectPath...
	const nameSegments = firstArg.text.split(".");
	return nameSegments[nameSegments.length - 1];
}

function getClassBodyFromArguments(
	nodeFactory: ts.NodeFactory, callExp: ts.CallExpression): ts.ClassElement[] {
	const args = callExp.arguments;
	let classBody: ts.ObjectLiteralExpression | undefined;
	for (let i = args.length - 1; i >= 0; i--) {
		const arg = args[i];
		if (ts.isObjectLiteralExpression(arg)) {
			classBody = arg;
			break;
		}
	}
	if (!classBody) {
		throw new UnsupportedExtendCall(`No class body found in extends call at ${toPosStr(callExp)}`);
	}
	if (classBody.properties.find((prop) => ts.isSpreadAssignment(prop) || ts.isShorthandPropertyAssignment(prop))) {
		// TODO: Support spread elements(?)
		throw new UnsupportedExtendCall(`Unsupported spread element in extends call body`);
	}
	return classBody.properties.map((prop): ts.ClassElement | undefined => {
		if (ts.isMethodDeclaration(prop)) {
			// Use method declarations as-is
			// e.g. "method() {}"
			return prop;
		} else if (ts.isPropertyAssignment(prop)) {
			if (ts.isFunctionExpression(prop.initializer)) {
				return nodeFactory.createMethodDeclaration(
					undefined, undefined,
					prop.name,
					undefined, undefined,
					prop.initializer.parameters,
					undefined,
					prop.initializer.body);
			} else {
				const modifiers: ts.ModifierLike[] = [];

				// Special handling:
				// - metadata: *readonly static*
				// - renderer: *static*
				// This aligns it with how UI5 projects should declare those properties in TypeScript
				if (
					ts.isObjectLiteralExpression(prop.initializer) &&
					ts.isIdentifier(prop.name) &&
					prop.name.text === "metadata"
				) {
					modifiers.push(nodeFactory.createToken(ts.SyntaxKind.ReadonlyKeyword));
					modifiers.push(nodeFactory.createToken(ts.SyntaxKind.StaticKeyword));
				} else if (ts.isIdentifier(prop.name) && prop.name.text === "renderer") {
					modifiers.push(nodeFactory.createToken(ts.SyntaxKind.StaticKeyword));
				} else if (prop.initializer.kind === ts.SyntaxKind.NullKeyword ||
					prop.initializer.kind === ts.SyntaxKind.UndefinedKeyword
				) {
					// Skip property assignments that declare a null value, in the hope
					// that tsc can infer a more useful type based on other assignment
					// in one of the methods. If we would define a class property, tsc
					// would not attempt to infer more type information.
					return;
				}

				// Assign all properties (including arrow functions) to the class prototype
				// This transformation does not reflect the runtime behavior where
				// properties are set on the Class's prototype. However, tsc won't derive *any*
				// type information from Object.defineProperty(Class.prototype, "prob", ...)
				// So the current approach works better for the static analysis

				return nodeFactory.createPropertyDeclaration(
					modifiers,
					prop.name,
					undefined, undefined,
					prop.initializer);
			}
		} else {
			throw new UnsupportedExtendCall(
				`While generating class body: Unexpected property type ${ts.SyntaxKind[prop.kind]} at ` +
				toPosStr(prop));
		}
	}).filter((_) => _) as ts.ClassElement[];
}
