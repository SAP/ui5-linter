import ts from "typescript";
import {getLogger} from "@ui5/logger";
import {toPosStr, UnsupportedModuleError} from "./util.js";
const {SyntaxKind} = ts;
const log = getLogger("transpilers:amd:pruneNode");

export class UnsafeNodeRemoval extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

/**
 * Marks a given node for removal. The node will be removed during a later step in the the transformation process.
 *
 * If the node's parent would become completely empty after removing the node, the parent is also marked for removal.
 * If the node's parent can't exist without the to-be-removed node, the node won't be removed.
 *
 * This is checked recursively for all parents
 */
export default function(node: ts.Node) {
	let nodeToRemove: ts.Node | undefined = node;
	try {
		while (nodeToRemove) {
			// Attempt to prune the node, if the parent can exist without it
			if (pruneNode(nodeToRemove)) {
				nodeToRemove = nodeToRemove.parent;
			} else {
				nodeToRemove = undefined;
			}
		}
	} catch(err) {
		if ((err instanceof UnsafeNodeRemoval || err instanceof UnsupportedModuleError) &&
			node !== nodeToRemove) {
			// Ignore UnsafeNodeRemoval and UnsupportedModuleError exceptions produced by parent nodes
			return;
		}
		throw err;
	}
}

/**
 * Attempt to prune a node, if the parent can exist without it (=> UnsafeNodeRemoval exception)
 *
 * Returns true if parent can be removed. This way the caller can continue to check the parent's parent, knowing
 * that the parent is already safe to be removed. Therefore no check is required at the beginning of this function.
 */
function pruneNode(node: ts.Node): boolean {
	log.verbose(`Pruning node ${SyntaxKind[node.kind]}`);
	node._remove = true;
	try {
		const parent = node.parent;
		if (isNodeRemovable(parent)) {
			// Parent can be removed
			log.verbose(`Parent node ${SyntaxKind[parent.kind]} can be removed`);
			return true;
		}
	} catch(err) {
		if (err instanceof UnsafeNodeRemoval || err instanceof UnsupportedModuleError) {
			// If an UnsafeNodeRemoval or UnsupporedModuleError is detected, revert the removal of the node as
			// this would indicate that the parent can't exist without it
			node._remove = false;
		}
		// Re-throw error in any case
		throw err;
	}
	return false;
}

/**
 * Check whether a given node can be marked for removal by checking whether
 * relevant child nodes have already been marked for removal.
 *
 * If removing the given node is not possible, but it is also not possible to keep it with the given
 * child nodes marked for removal, an error is thrown.
 *
 * Note that some nodes can't exist without certain child nodes. Leaving those
 * nodes after removing their children will cause errors during later AST processing
 */
function isNodeRemovable(node: ts.Node): boolean {
	switch(node.kind) {
	case SyntaxKind.SourceFile:
		// Never remove the source file
		return false;

	// Nodes with only one child
	case SyntaxKind.Identifier:
	case SyntaxKind.ExpressionStatement:
	case SyntaxKind.VariableDeclaration:
	case SyntaxKind.VariableStatement:
	case SyntaxKind.ParenthesizedExpression:
	case SyntaxKind.ReturnStatement:
	case SyntaxKind.AwaitExpression:
	case SyntaxKind.ComputedPropertyName:
	case SyntaxKind.Parameter:
	case SyntaxKind.PrefixUnaryExpression:
	case SyntaxKind.PostfixUnaryExpression:
		// These nodes can only have one child
		// So if the child is removed, the parent must be removed as well
		return true;

	// Nodes with multiple children
	case SyntaxKind.FunctionExpression:
		return isRemovableFunctionExpression(node as ts.FunctionExpression);
	case SyntaxKind.MethodDeclaration:
		return isRemovableMethodDeclaration(node as ts.MethodDeclaration);
	case SyntaxKind.NewExpression:
		return isRemovableNewExpression(node as ts.NewExpression);
	case SyntaxKind.ArrowFunction:
		return isRemovableArrowFunction(node as ts.ArrowFunction);
	case SyntaxKind.IfStatement:
		return isRemovableIfStatement(node as ts.IfStatement);
	case SyntaxKind.BinaryExpression:
		return isRemovableBinaryExpression(node as ts.BinaryExpression);
	case SyntaxKind.ConditionalExpression:
		return isRemovableConditionalExpression(node as ts.ConditionalExpression);
	case SyntaxKind.ForStatement:
		return isRemovableForStatement(node as ts.ForStatement);
	case SyntaxKind.WhileStatement:
		return isRemovableWhileStatement(node as ts.WhileStatement);
	case SyntaxKind.DoStatement:
		return isRemovableDoStatement(node as ts.DoStatement);
	case SyntaxKind.PropertyAccessExpression:
		return isRemovablePropertyAccessExpression(node as ts.PropertyAccessExpression);
	case SyntaxKind.ElementAccessExpression:
		return isRemovableElementAccessExpression(node as ts.ElementAccessExpression);
	case SyntaxKind.FunctionDeclaration:
		return isRemovableFunctionDeclaration(node as ts.FunctionDeclaration);
	case SyntaxKind.PropertyAssignment:
		return isRemovablePropertyAssignment(node as ts.PropertyAssignment);
	case SyntaxKind.PropertyDeclaration:
		return isRemovablePropertyDeclaration(node as ts.PropertyDeclaration);
	case SyntaxKind.YieldExpression:
		return isRemovableYieldExpression(node as ts.YieldExpression);
	case SyntaxKind.ArrayLiteralExpression:
		return isRemovableArrayLiteralExpression(node as ts.ArrayLiteralExpression);

	case SyntaxKind.VariableDeclarationList:
		return isRemovableVariableDeclarationList(node as ts.VariableDeclarationList);
	case SyntaxKind.Block:
		return isRemovableBlock(node as ts.Block);
	case SyntaxKind.ObjectLiteralExpression:
		return isRemovableObjectLiteralExpression(node as ts.ObjectLiteralExpression);
	case SyntaxKind.CallExpression:
		return isRemovableCallExpression(node as ts.CallExpression);
	case SyntaxKind.ClassDeclaration:
		return isRemovableClassDeclaration(node as ts.ClassDeclaration);
	default:
		throw new UnsupportedModuleError(
			`Unsupported parent node type for prune operation: ${SyntaxKind[node.kind]} at ` +
			`${toPosStr(node)}`);
	}
}

function isNotMarkedForRemoval(node: ts.Node) {
	return !node._remove;
}

function hasAllNodesMarkedForRemoval(nodes: ts.NodeArray<ts.Node>) {
	return !nodes.some(isNotMarkedForRemoval);
}

function isRemovableFunctionExpression(node: ts.FunctionExpression): boolean {
	// If the body is marked for removal, remove the whole function
	// Even if parameters are not marked for removal
	return !!node.body?._remove;
}

function isRemovableMethodDeclaration(node: ts.MethodDeclaration): boolean {
	// If the body is marked for removal, remove the whole function
	// Even if parameters are not marked for removal
	return !!node.body?._remove;
}

function isRemovableNewExpression(node: ts.NewExpression): boolean {
	return !!node.expression._remove && (!node.arguments|| hasAllNodesMarkedForRemoval(node.arguments));
}

function isRemovableArrowFunction(node: ts.ArrowFunction): boolean {
	return !!node.body._remove;
}

function isRemovableIfStatement(node: ts.IfStatement): boolean {
	if (node.thenStatement._remove && (!node.elseStatement || node.elseStatement?._remove)) {
		return true;
	}
	throw new UnsafeNodeRemoval(
		`Cannot remove IfStatement with only one part marked for removal at ${toPosStr(node)}`);
}

function isRemovableBinaryExpression(node: ts.BinaryExpression): boolean {
	// Both sides of the binary expression are marked for removal => Remove the whole expression
	if(node.left._remove && node.right._remove) {
		return true;
	}
	throw new UnsafeNodeRemoval(
		`Cannot remove BinaryExpression with only one side marked for removal at ${toPosStr(node)}`);
}

function isRemovableConditionalExpression(node: ts.ConditionalExpression): boolean {
	if (node.condition._remove && node.whenTrue._remove && node.whenFalse._remove) {
		// All parts of the conditional expression are marked for removal => Remove the whole expression
		return true;
	}
	throw new UnsafeNodeRemoval(
		`Cannot remove ConditionalExpression with only one part marked for removal at ${toPosStr(node)}`);
}

function isRemovableForStatement(
	node: ts.ForStatement
): boolean {
	if (node.statement._remove && (!node.initializer || node.initializer._remove) &&
		(!node.condition || node.condition._remove) && (!node.incrementor || node.incrementor._remove)) {
		return true;
	}
	throw new UnsafeNodeRemoval(
		`Cannot remove ForStatement with only one part marked for removal at ${toPosStr(node)}`);
}

function isRemovableWhileStatement(
	node: ts.WhileStatement
): boolean {
	if (node.statement._remove && node.expression._remove) {
		return true;
	}
	throw new UnsafeNodeRemoval(
		`Cannot remove WhileStatment with only one part marked for removal at ${toPosStr(node)}`);
}

function isRemovableDoStatement(
	node: ts.DoStatement
): boolean {
	if (node.statement._remove && node.expression._remove) {
		return true;
	}
	throw new UnsafeNodeRemoval(
		`Cannot remove DoStatement with only one part marked for removal at ${toPosStr(node)}`);
}

function isRemovablePropertyAccessExpression(
	node: ts.PropertyAccessExpression
): boolean {

	if (node.name._remove && node.expression._remove) {
		return true;
	}
	throw new UnsafeNodeRemoval(
		`Cannot remove PropertyAccessExpression with only one part marked for removal at ${toPosStr(node)}`);
}

function isRemovableElementAccessExpression(
	node: ts.ElementAccessExpression
): boolean {
	if (node.argumentExpression._remove && node.expression._remove) {
		return true;
	}
	throw new UnsafeNodeRemoval(
		`Cannot remove ElementAccessExpression with only one part marked for removal at ${toPosStr(node)}`);
}

function isRemovableFunctionDeclaration(
	node: ts.FunctionDeclaration
): boolean {
	// If the body is marked for removal, remove the whole function
	return !!node.body?._remove;
}

function isRemovablePropertyAssignment(
	node: ts.PropertyAssignment
): boolean {
	// If the name is marked for removal, remove the whole property assignment
	if (node.name?._remove) {
		return true;
	}
	throw new UnsafeNodeRemoval(
		`Cannot remove PropertyAssignment with only the initializer marked for removal at ${toPosStr(node)}`);
}

function isRemovablePropertyDeclaration(
	node: ts.PropertyDeclaration
): boolean {
	// If the name is marked for removal, remove the whole property declaration
	if (node.name?._remove) {
		return true;
	}
	throw new UnsafeNodeRemoval(
		`Cannot remove PropertyDeclaration with only the initializer marked for removal at ${toPosStr(node)}`);
}

function isRemovableYieldExpression(
	node: ts.YieldExpression
): boolean {
	// If the expression is marked for removal, remove the whole yield expression
	return !!node.expression?._remove;
}

function isRemovableArrayLiteralExpression(
	node: ts.ArrayLiteralExpression
): boolean {
	// All elements are marked for removal => Remove the whole array literal
	return hasAllNodesMarkedForRemoval(node.elements);
}

function isRemovableVariableDeclarationList(node: ts.VariableDeclarationList): boolean {
	// All declarations are marked for removal => Remove the whole list
	return hasAllNodesMarkedForRemoval(node.declarations);
}

function isRemovableBlock(node: ts.Block): boolean {
	// All statements in the block are marked for removal => Remove the whole block
	return hasAllNodesMarkedForRemoval(node.statements);
}

function isRemovableObjectLiteralExpression(node: ts.ObjectLiteralExpression): boolean {
	// All properties are marked for removal => Remove the whole object literal
	return hasAllNodesMarkedForRemoval(node.properties);
}

function isRemovableCallExpression(node: ts.CallExpression): boolean {
	// All arguments are marked for removal => Remove the whole call expression
	return !!node.expression._remove && hasAllNodesMarkedForRemoval(node.arguments);
}

function isRemovableClassDeclaration(node: ts.ClassDeclaration): boolean {
	// If the body is marked for removal, remove the whole class
	return hasAllNodesMarkedForRemoval(node.members);
}
