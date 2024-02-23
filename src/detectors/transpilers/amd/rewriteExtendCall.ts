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
	callExp: ts.CallExpression, modifiers?: ts.ModifierLike[]): ts.ClassDeclaration {
	if (!(ts.isPropertyAccessExpression(callExp.expression) && ts.isIdentifier(callExp.expression.name) &&
		callExp.expression.name.text === "extend")) {
		throw new UnsupportedExtendCall(`Not a UI5 Class#extends call ${toPosStr(callExp.expression)}`);
	}

	const className = getClassNameFromArguments(callExp.arguments);
	const body = getClassBodyFromArguments(nodeFactory, callExp.arguments);
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

function getClassNameFromArguments(args: ts.CallExpression["arguments"]): string {
	const firstArg = args[0];
	if (firstArg && !ts.isStringLiteralLike(firstArg)) {
		throw new UnsupportedExtendCall(`Unexpected extends argument of type ${ts.SyntaxKind[firstArg.kind]} at ` +
			toPosStr(firstArg));
	}
	// Just like OpenUI5's ObjectPath...
	const nameSegments = firstArg.text.split(".");
	return nameSegments[nameSegments.length - 1];
}

function getClassBodyFromArguments(
	nodeFactory: ts.NodeFactory, args: ts.CallExpression["arguments"]): ts.ClassElement[] {
	let classBody: ts.ObjectLiteralExpression | undefined;
	for (let i = args.length - 1; i >= 0; i--) {
		const arg = args[i];
		if (ts.isObjectLiteralExpression(arg)) {
			classBody = arg;
			break;
		}
	}
	if (!classBody) {
		throw new UnsupportedExtendCall(`No class body found in extends call at ${toPosStr(args[0])}`);
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
			} else if (ts.isObjectLiteralExpression(prop.initializer) &&
					ts.isIdentifier(prop.name) && prop.name.text === "metadata") {
				// Transform to *static* property declaration?
				// This would align it with how UI5 projects should declare metadata in TypeScript,
				// however it's unclear whether this helps our static analysis
				return nodeFactory.createPropertyDeclaration(
					[nodeFactory.createToken(ts.SyntaxKind.StaticKeyword)],
					prop.name,
					undefined, undefined,
					prop.initializer);
			} else {
				// Assign all other properties (including arrow functions) to the class prototype
				// This transformation does not reflect the runtime behavior where
				// properties are set on the Class's prototype. However, tsc won't derive *any*
				// type information from Object.defineProperty(Class.prototype, "prob", ...)
				// So the current approach works better for the static analysis
				if (prop.initializer.kind === ts.SyntaxKind.NullKeyword ||
					prop.initializer.kind === ts.SyntaxKind.UndefinedKeyword) {
					// Skip property assignments that declare a null value, in the hope
					// that tsc can infer a more useful type based on other assignment
					// in one of the methods. If we would define a class property, tsc
					// would not attempt to infer more type information.
					return;
				}
				return nodeFactory.createPropertyDeclaration(
					undefined,
					prop.name,
					undefined, undefined,
					prop.initializer);
			}
		} else {
			throw new UnsupportedExtendCall(
				`While generating class body: Unexpected property type ${ts.SyntaxKind[prop.kind]} at ` +
				toPosStr(prop));
		}

	}).filter(_ => _) as ts.ClassElement[];
}
