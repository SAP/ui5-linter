import ts from "typescript";
import {getLogger} from "@ui5/logger";
import {UnsupportedModuleError, toPosStr} from "./util.js";
const log = getLogger("amd:parseRequire");

const {SyntaxKind} = ts;

export interface ProbingRequireExpression {
	async: false;
	dependency: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral;
}
export interface RequireExpression {
	async: true;
	dependencies: ts.ArrayLiteralExpression;
	callback?: ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration;
	errback?: ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration;
}

/**
 * For a given array of arguments, try to match them to the parameters of the sap.ui.define and sap.ui.predefine
 * signatures
 */
export default function parseRequire(
	args: ts.CallExpression["arguments"], checker: ts.TypeChecker
): ProbingRequireExpression | RequireExpression {
	/*
	Signature: sap.ui.require(vDependencies, fnCallback?, fnErrback?)
		* vDependencies must be provided and can be a string literal or an array of string literals
		* fnCallback can be omitted, or is an (Arrow-)FunctionExpression receiving the resolved dependencies
		* fnErrback can be omitted, or is an (Arrow-)FunctionExpression receiving the error

		If vDependencies is a string literal, synchronous probing for a potentially already loaded module is assumed.
		In that case the return value is either the module content or undefined (in case the module is not available).
		=> Always generate a type annotation in this case

		If vDependencies is an array, the return value is always undefined.

		Each arguments can also be an Identifier. Whenever an Identifier is used, try to resolve it to a concrete type
		before attempting to match it to a parameter. If it can't be resolved, an UnsupportedModuleError is thrown.

		Similarly, each argument can also be a CallExpression, in which case we would have to try and resolve its
		return type, which is currently out-of-scope.
	*/

	if (args.length < 1 || args.length > 3) {
		throw new UnsupportedModuleError(`Unexpected number of arguments (${args.length}) in sap.ui.require call`);
	}

	// TODO: Create reuse between this and parseModuleDeclaration
	const resolvedArgs = args.map((arg): ts.Expression | ts.Declaration => {
		if (ts.isIdentifier(arg)) {
			// Try and resolve the identifier to a more concrete node
			const sym = checker.getSymbolAtLocation(arg);
			if (sym?.declarations) {
				for (const decl of sym.declarations) {
					if (ts.isVariableDeclaration(decl)) {
						if (decl.initializer) {
							return decl.initializer;
						}
					} else if (ts.isParameter(decl)) {
						// Check for iife
						if (decl?.parent.kind === SyntaxKind.FunctionExpression &&
							decl.parent.parent?.kind === SyntaxKind.ParenthesizedExpression &&
							decl.parent.parent.parent?.kind === SyntaxKind.CallExpression) {
							log.verbose(`Found iife`);
							const funcExp = decl.parent;
							const callExp = decl.parent.parent.parent as ts.CallExpression;
							// Determine parameter position
							const paramIdx = funcExp.parameters.indexOf(decl);
							if (paramIdx === -1) {
								throw new Error(`Failed to determine parameter index for iife`);
							}
							return callExp.arguments[paramIdx];
						} // Else: It is's not an iife, we can't resolve the argument value
					} else {
						return decl;
					}
				}
			}
			return arg;
		} else {
			return arg;
		}
	});

	return _matchArgumentsToParameters(assertSupportedTypes(resolvedArgs));
}

// Keep this type in sync with the "assertSupportedTypes" function
export type RequireCallArgument = ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | ts.ArrayLiteralExpression |
	ts.ArrowFunction | ts.FunctionExpression |
	ts.FunctionDeclaration;

function assertSupportedTypes(args: (ts.Expression | ts.Declaration)[]): RequireCallArgument[] {
	args.forEach((arg, idx) => {
		// We only support a certain set of types. Abort if we encounter anything else
		switch (arg.kind) {
			case SyntaxKind.StringLiteral:
			case SyntaxKind.NumericLiteral:
			case SyntaxKind.ArrayLiteralExpression:
			case SyntaxKind.ObjectLiteralExpression:
			case SyntaxKind.ArrowFunction:
			case SyntaxKind.FunctionExpression:
			case SyntaxKind.TrueKeyword:
			case SyntaxKind.FalseKeyword:
			case SyntaxKind.FunctionDeclaration:
			case SyntaxKind.ClassDeclaration:
			case SyntaxKind.NoSubstitutionTemplateLiteral:
			case SyntaxKind.PropertyAccessExpression:
				return;
			default:
				throw new UnsupportedModuleError(
				`Unsupported type for argument in sap.ui.define call at index ${idx}: ${SyntaxKind[arg.kind]}`);
		}
	});
	return args as unknown as RequireCallArgument[];
}

function _matchArgumentsToParameters(args: RequireCallArgument[]): ProbingRequireExpression | RequireExpression {
	const [dependencies, callback, errback] = args;

	if (ts.isArrayLiteralExpression(dependencies)) {
		if (callback && !(ts.isFunctionExpression(callback) ||
			ts.isArrowFunction(callback) ||
			ts.isFunctionDeclaration(callback))) {
			throw new UnsupportedModuleError(
				`Expected second argument of sap.ui.require call to be a function but got ` +
				`${ts.SyntaxKind[callback.kind]} at ${toPosStr(callback)}`);
		}
		if (errback && !(ts.isFunctionExpression(errback) ||
			ts.isArrowFunction(errback) ||
			ts.isFunctionDeclaration(errback))) {
			throw new UnsupportedModuleError(
				`Expected second argument of sap.ui.require call to be a function but got ` +
				`${ts.SyntaxKind[errback.kind]} at ${toPosStr(errback)}`);
		}
		return {
			async: true,
			dependencies,
			callback,
			errback,
		};
	} else if (ts.isStringLiteralLike(dependencies)) {
		return {
			async: false,
			dependency: dependencies,
		};
	} else {
		throw new UnsupportedModuleError(
			`Expected first argument of sap.ui.require call to be a string literal or array expression but got ` +
			`${ts.SyntaxKind[dependencies.kind]} at ${toPosStr(dependencies)}`);
	}
}
