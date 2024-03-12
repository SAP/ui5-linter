/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import ts from "typescript";
import {getLogger} from "@ui5/logger";
import {UnsupportedModuleError} from "./util.js";
const log = getLogger("transpilers:amd:parseModuleDeclaration");

const {SyntaxKind} = ts;

export interface ModuleDeclaration {
	moduleName?: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral;
	dependencies?: ts.ArrayLiteralExpression;
	factory: DefineCallArgument;
	export?: ts.BooleanLiteral;
}

/**
 * For a given array of arguments, try to match them to the parameters of the sap.ui.define and sap.ui.predefine
 * signatures
 */
export default function parseModuleDeclaration(
	args: ts.CallExpression["arguments"], checker: ts.TypeChecker
): ModuleDeclaration {
	/*
	Signature: sap.ui.define(sModuleName?, aDependencies?, vFactory, bExport?)
		* sModuleName can be omitted, or is string Literal
		* aDependencies can be omitted, or is an ArrayExpression (containing string Literals)
		* vFactory must be provided and can be anything (typically an (Arrow-)FunctionExpression or an ObjectExpression)
		* bExport can be omitted, or is a boolean Literal

		Each arguments can also be an Identifier. Whenever an Identifier is used, try to resolve it to a concrete type
		before attempting to match it to a parameter. If it can't be resolved, an UnsupportedModuleError is thrown.

		Similarly, each argument can also be a CallExpression, in which case we would have to try and resolve its
		return type, which is currently out-of-scope.

	Signature: sap.ui.predefine(sModuleName, aDependencies?, vFactory, bExport?)
		* sModuleName is required
	*/

	if (args.length > 4) {
		throw new UnsupportedModuleError(`Unexpected number of arguments (${args.length}) in sap.ui.define call`);
	}
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
		}
		return arg;
	});

	return _matchArgumentsToParameters(assertSupportedTypes(resolvedArgs));
}

// Keep this type in sync with the "assertSupportedTypes" function
export type DefineCallArgument = ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | ts.NumericLiteral |
	ts.ArrayLiteralExpression | ts.BooleanLiteral | ts.PropertyAccessExpression |
	ts.ObjectLiteralExpression | ts.ArrowFunction | ts.FunctionExpression |
	ts.FunctionDeclaration | ts.ClassDeclaration;

function assertSupportedTypes(args: (ts.Expression | ts.Declaration)[]): DefineCallArgument[] {
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
	return args as unknown as DefineCallArgument[];
}

const enum Param {
	ModuleName = 0,
	Dependencies = 1,
	Factory = 2,
	Export = 3,
}

export function _matchArgumentsToParameters(args: DefineCallArgument[]): ModuleDeclaration {
	// Create a grid of possible matches between the provided arguments and the expected parameters
	const matchGrid = [];

	if (args[0]) {
		matchGrid.push(permute(args[0], Param.ModuleName));
	}
	if (args[1]) {
		matchGrid.push(permute(args[1], Param.Dependencies));
	}
	if (args[2]) {
		matchGrid.push(permute(args[2], Param.Factory));
	}
	if (args[3]) {
		matchGrid.push(permute(args[3], Param.Export));
	}

	// This results in a two dimensional array containing values
	// for all allowed permutations of the provided arguments
	// Now we calculate the best match
	for (let i = 0; i < matchGrid.length; i++) {
		for (let j = 0; j < matchGrid[i].length; j++) {
			if (matchGrid[i][j]) {
				// Match
				if (i > 0 && j > 0) {
					matchGrid[i][j] = matchGrid[i - 1][j - 1] + 1;
				} else {
					matchGrid[i][j] = 1;
				}
			} else {
				// No match
				let prevI = 0, prevJ = 0;
				if (i > 0) {
					prevI = matchGrid[i - 1][j];
				}
				if (j > 0) {
					prevJ = matchGrid[i][j - 1];
				}
				matchGrid[i][j] = Math.max(prevI, prevJ);
			}
		}
	}
	/* Visualization for the resulting "matchGrid":
		// Case 1
		Input (3 arguments): ArrayLiteralExpression, FunctionExpression, TrueKeyword
		┌─────────────────┐
		│arg\param│ 0 │ 1 │ 2 │ 3 │
		├─────────────────┤
		│ 0       │ 0 │ 1 │ 1 │ 1 │
		│ 1       │ 0 │ 1 │ 2 │ 2 │
		│ 2       │ 0 │ 1 │ 2 │ 3 │
		└─────────────────┘
		Solution:
			arg #0 => dependencies, arg #1 => factory, arg #2 => export flag
			(=> moduleName has been omitted)

		Legend for the for-loop below:
			arg = i
			param = j
	*/

	// Find the highest matches and assign parameters accordingly
	const result: Partial<ModuleDeclaration> = {};
	let highestMatch = 0;

	for (let i = 0; i < matchGrid.length; i++) {
		for (let j = 0; j <= Param.Export; j++) {
			if (matchGrid[i][j] > highestMatch) {
				highestMatch = matchGrid[i][j];
				if (j === Param.ModuleName) {
					result.moduleName = args[i] as ModuleDeclaration["moduleName"];
				} else if (j === Param.Dependencies) {
					result.dependencies = args[i] as ModuleDeclaration["dependencies"];
				} else if (j === Param.Factory) {
					result.factory = args[i];
				} else if (j === Param.Export) {
					result.export = args[i] as ModuleDeclaration["export"];
				}
			}
		}
	}
	return result as ModuleDeclaration;
}

// Compute which parameters the given argument could match with based on it's type
// For example an ArrayLiteralExpression could only be the dependencies or the factory parameter
function permute(arg: DefineCallArgument, startAt: Param): number[] {
	const perm = Array(4).fill(0) as number[];

	if (startAt <= Param.ModuleName && canBeModuleName(arg)) {
		perm[0] = 1;
	}

	if (startAt <= Param.Dependencies && canBeDependencies(arg)) {
		perm[1] = 1;
	}
	if (startAt <= Param.Factory && canBeFactory(arg)) {
		perm[2] = 1;
	}

	if (startAt <= Param.Export && canBeExport(arg)) {
		perm[3] = 1;
	}
	return perm;
}

function canBeModuleName(arg: DefineCallArgument) {
	return arg.kind === SyntaxKind.StringLiteral ||
		arg.kind === SyntaxKind.NoSubstitutionTemplateLiteral;
}
function canBeDependencies(arg: DefineCallArgument) {
	return arg.kind === SyntaxKind.ArrayLiteralExpression;
}
function canBeFactory(_arg: DefineCallArgument) {
	return true; // All supported types can be used for factory
}
function canBeExport(arg: DefineCallArgument) {
	return arg.kind === SyntaxKind.TrueKeyword || arg.kind === SyntaxKind.FalseKeyword;
}
