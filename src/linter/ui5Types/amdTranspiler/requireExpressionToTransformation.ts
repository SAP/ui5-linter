import ts from "typescript";
import {getLogger} from "@ui5/logger";
import {UnsupportedModuleError, toPosStr} from "./util.js";
import {ProbingRequireExpression, RequireExpression} from "./parseRequire.js";
const log = getLogger("linter:ui5Types:amdTranspiler:transformRequireCall");
import {resolveUniqueName} from "../utils/utils.js";

export interface RequireTransformationAsync {
	imports: ts.ImportDeclaration[];
	callback?: ts.CallExpression;
	errback?: ts.FunctionDeclaration;
}

export interface RequireTransformationSync {
	import: ts.ImportDeclaration;
	requireStatement: ts.Identifier | ts.AsExpression; // Identifier for JS transpilation, AsExpression for TS
}

export function transformAsyncRequireCall(
	node: ts.CallExpression, requireExpression: RequireExpression, nodeFactory: ts.NodeFactory
): RequireTransformationAsync {
	const {dependencies, callback, errback} = requireExpression;
	const imports: ts.ImportDeclaration[] = [];
	const importIdentifiers: ts.Identifier[] = [];

	let callbackParams: ts.Identifier[] | undefined;
	let callbackRequiresCallWrapper = false;
	if (callback) {
		if (ts.isFunctionExpression(callback) ||
			ts.isArrowFunction(callback) ||
			ts.isFunctionDeclaration(callback)) {
			// Extract parameter names
			callbackParams = callback.parameters.map((param) => {
				if (!ts.isIdentifier(param.name)) {
					// Indicates destructuring in factory signature. This is not (yet?) supported
					throw new UnsupportedModuleError(
						`Unexpected parameter type ${ts.SyntaxKind[param.kind]} ` +
						`at ${toPosStr(param)}`);
				}
				return param.name;
			});
		} else if (ts.isIdentifier(callback)) {
			callbackRequiresCallWrapper = true;
		}
	}

	// Create import statements based on callback parameters
	dependencies.elements.forEach((dep, i) => {
		// Create import statements
		let moduleSpecifier: ts.StringLiteral;
		if (!ts.isStringLiteralLike(dep)) {
			log.verbose(`Skipping non-string dependency entry of type ${ts.SyntaxKind[dep.kind]} at ` +
				toPosStr(dep));
			return;
		}
		if (ts.isNoSubstitutionTemplateLiteral(dep)) {
			moduleSpecifier = nodeFactory.createStringLiteral(dep.text);
			// Set range to the original range to preserve source mapping capability
			ts.setTextRange(moduleSpecifier, dep);
		} else {
			moduleSpecifier = dep;
		}
		let identifier: ts.Identifier | undefined;
		if (callbackRequiresCallWrapper) {
			// Generate variable name based on import module
			// Later this variable will be used to call the factory function
			identifier = nodeFactory.createUniqueName(resolveUniqueName(dep.text));
		} else if (callbackParams?.[i]) {
			// Use factory parameter identifier as import identifier
			identifier = callbackParams[i];
		} // else: Side effect imports. No identifier needed

		let importClause;
		if (identifier) {
			importIdentifiers.push(identifier);
			importClause = nodeFactory.createImportClause(false, identifier, undefined);
		}

		imports.push(nodeFactory.createImportDeclaration(
			undefined,
			importClause,
			moduleSpecifier
		));
	});

	let callbackStatement: ts.CallExpression | undefined;
	if (callback) {
		if (ts.isFunctionExpression(callback) || ts.isArrowFunction(callback)) {
			// Transform callback into iife rather than extracting the body. This way we preserve the scope and
			// prevent clashes with variable declarations from other scopes
			callbackStatement = nodeFactory.createCallExpression(callback, undefined, importIdentifiers);
		} else if (ts.isFunctionDeclaration(callback) && callback.name) {
			// Call the declaration
			callbackStatement = nodeFactory.createCallExpression(callback.name, undefined, importIdentifiers);
		}
	}

	let errbackDeclaration: ts.FunctionDeclaration | undefined;
	if (errback) {
		if (ts.isFunctionExpression(errback)) {
			// Convert into a function declaration that is not called. This way the content can still be analyzed
			// but there are no runtime effects given that such a callback doesn't exist in the ESM world
			errbackDeclaration = nodeFactory.createFunctionDeclaration(
				errback.modifiers,
				errback.asteriskToken,
				errback.name ?? nodeFactory.createUniqueName("extracted_require_errback"),
				errback.typeParameters,
				errback.parameters,
				errback.type,
				errback.body);
		} else if (ts.isArrowFunction(errback)) {
			let body: ts.Block;
			if (ts.isBlock(errback.body)) {
				body = errback.body;
			} else { // isExpression
				body = nodeFactory.createBlock([nodeFactory.createReturnStatement(errback.body)]);
			}
			errbackDeclaration = nodeFactory.createFunctionDeclaration(
				errback.modifiers,
				errback.asteriskToken,
				nodeFactory.createUniqueName("extracted_require_errback"),
				errback.typeParameters,
				errback.parameters,
				errback.type,
				body);
		}
	}
	return {
		imports,
		callback: callbackStatement,
		errback: errbackDeclaration,
	};
}

export function transformSyncRequireCall(
	node: ts.CallExpression, requireExpression: ProbingRequireExpression, nodeFactory: ts.NodeFactory
): RequireTransformationSync {
	const {dependency} = requireExpression;

	// Generate variable name based on import module
	// Later this variable will be used to call the factory function
	const identifier = nodeFactory.createUniqueName(resolveUniqueName(dependency.text));
	const importDeclaration = nodeFactory.createImportDeclaration(
		undefined,
		nodeFactory.createImportClause(false, identifier, undefined),
		dependency
	);

	// TODO: The following is only possible if we can emit TypeScript with source maps
	// Annotate sap.ui.require call return type with the type of the dependency
	// const requireStatement = nodeFactory.createExpressionStatement(
	// 	nodeFactory.createAsExpression(node, nodeFactory.createTypeReferenceNode(dependency.text, undefined)));
	// const requireStatement =
	// 	nodeFactory.createAsExpression(node, nodeFactory.createTypeReferenceNode(identifier, undefined));

	const requireStatement = identifier;
	return {
		import: importDeclaration,
		requireStatement,
	};
}
