import ts from "typescript";
import {getLogger} from "@ui5/logger";
import parseModuleDeclaration from "./parseModuleDeclaration.js";
import moduleDeclarationToDefinition, {ModuleDefinition} from "./moduleDeclarationToDefinition.js";
import parseRequire from "./parseRequire.js";
import {transformAsyncRequireCall, transformSyncRequireCall} from "./requireExpressionToTransformation.js";
import pruneNode, {UnsafeNodeRemoval} from "./pruneNode.js";
import replaceNodeInParent, {NodeReplacement} from "./replaceNodeInParent.js";
import {UnsupportedModuleError} from "./util.js";

const log = getLogger("transpilers:amd:TsTransformer");

// Augment typescript's Node interface to add a property for marking nodes for removal
declare module "typescript" {
	interface Node {
		_remove?: boolean
	}
}

/**
 * Creates a TypeScript "transformer" that will be applied to each source file, doing the actual transpilation
 * The source file is expected to be classic UI5 JavaScript, using UI5s's AMD loader and other UI5 specific API.
 * Modern JavaScript language features are generally supported, however there might be gaps in the implementation
 * at the time of writing this comment.
 *
 * If a transformation of a specific API (such as "sap.ui.define") is not possible for some reason, an "Unsupported*"
 * error is thrown. In that case, the rest of the module is still processed. However it's possible that the result
 * will be equal to the input.
*/
export function createTransformer(resourcePath: string, program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	return function transformer(context: ts.TransformationContext) {
		return (sourceFile: ts.SourceFile): ts.SourceFile => {
			return transform(resourcePath, program, sourceFile, context);
		};
	};
}

function transform(
	resourcePath: string, program: ts.Program, sourceFile: ts.SourceFile, context: ts.TransformationContext
): ts.SourceFile {
	const checker = program.getTypeChecker();
	const {factory: nodeFactory} = context;
	const moduleDefinitions: ModuleDefinition[] = [];
	// TODO: Filter duplicate imports, maybe group by module definition
	const requireImports: ts.ImportDeclaration[] = [];
	const requireFunctions: ts.FunctionDeclaration[] = [];
	const nodeReplacements = new Map<ts.Node, NodeReplacement[]>();

	function replaceNode(node: ts.Node, substitute: ts.Node) {
		let replacements = nodeReplacements.get(node.parent);
		if (!replacements) {
			replacements = [];
			nodeReplacements.set(node.parent, replacements);
		}
		replacements.push({original: node, substitute});
	}

	// Visit the AST depth-first and collect module definitions
	function visit(nodeIn: ts.Node): ts.VisitResult<ts.Node> {
		const node = ts.visitEachChild(nodeIn, visit, context);
		if (ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression)) {
			if (matchPropertyAccessExpression(node.expression, "sap.ui.define")) {
				try {
					const moduleDeclaration = parseModuleDeclaration(node.arguments, checker);
					const moduleDefinition = moduleDeclarationToDefinition(moduleDeclaration, sourceFile, nodeFactory);
					moduleDefinitions.push(moduleDefinition);
					pruneNode(node); // Mark the define call for removal
				} catch(err) {
					if (err instanceof UnsupportedModuleError) {
						log.verbose(`Failed to transform sap.ui.define call in ${resourcePath}: ${err.message}`);
					} else {
						throw err;
					}
				}
			} else if (matchPropertyAccessExpression(node.expression, "sap.ui.require")) {
				try {
					const requireExpression = parseRequire(node.arguments, checker);
					if (requireExpression.async) {
						const res = transformAsyncRequireCall(node, requireExpression, nodeFactory);
						requireImports.push(...res.imports);
						if (res.callback) {
							replaceNode(node, res.callback);
							if (res.errback) {
								requireFunctions.push(res.errback);
							}
						} else {
							// async sap.ui.require without a callback (import only)
							try {
								pruneNode(node);
							} catch(err) {
								if (err instanceof UnsafeNodeRemoval) {
									// If removal is not possible, replace the CallExpression with "undefined"
									// (i.e. the original return value)
									replaceNode(node, nodeFactory.createIdentifier("undefined"));
								} else {
									throw err;
								}
							}
						}
					} else {
						const res = transformSyncRequireCall(node, requireExpression, nodeFactory);
						requireImports.push(res.import);
						replaceNode(node, res.requireStatement);
					}
				} catch(err) {
					if (err instanceof UnsupportedModuleError) {
						log.verbose(`Failed to transform sap.ui.require call in ${resourcePath}: ${err.message}`);
					} else {
						throw err;
					}
				}
			}
		}
		return node;
	}
	let processedSourceFile = ts.visitNode(sourceFile, visit) as ts.SourceFile;

	const statements = [
		...requireImports,
		...processedSourceFile.statements as unknown as ts.Statement[],
		...requireFunctions,
	];
	moduleDefinitions.forEach(({imports, body}) => {
		// Add imports of each module definition to the top of the program
		statements.unshift(...imports);
		// Add the module definition body to the end of the program
		statements.push(...body);
	});

	// Update the AST with extracted nodes from the module definitions and require expressions
	processedSourceFile = nodeFactory.updateSourceFile(processedSourceFile, statements);

	// Visit the AST breadth-first and remove nodes marked for remove as well as
	// replacing nodes marked for replacement
	function removeAndReplaceNodes(node: ts.Node): ts.VisitResult<ts.Node | undefined> {
		if (node._remove) {
			// console.log(`Cleanup: Removing node ${ts.SyntaxKind[node.kind]}`);
			return undefined;
		}
		const replacements = nodeReplacements.get(node);
		if (replacements) {
			for (const replacement of replacements) {
				node = replaceNodeInParent(node, replacement, nodeFactory);
			}
		}
		return ts.visitEachChild(node, removeAndReplaceNodes, context);
	}
	processedSourceFile = ts.visitNode(processedSourceFile, removeAndReplaceNodes) as ts.SourceFile;
	return processedSourceFile;
}

// TODO PERF: Use a match array instead of string to be able to match individual parts of the property access chain
// early (i.e. exist immediately if the last expression does not match the last match)
function matchPropertyAccessExpression(node: ts.PropertyAccessExpression, match: string) : boolean {
	const propAccessChain: string[] = [];
	propAccessChain.push(node.expression.getText());

	let scanNode: ts.Node = node;
	while (ts.isPropertyAccessExpression(scanNode)) {
		propAccessChain.push(scanNode.name.getText());
		scanNode = scanNode.parent;
	}
	return propAccessChain.join(".") === match;
}
