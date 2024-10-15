import ts from "typescript";

interface InsertOperation {
	index: number;
	nodes: ts.Statement[];
};

/**
 * Inserts a node after the specified node in the parent block
 */
export default function insertNodesInParent(
	parentNode: ts.SourceFile | ts.Block, insertionsMap: Map<ts.Statement, ts.Statement[]>, nodeFactory: ts.NodeFactory
): ts.SourceFile | ts.Block | undefined {
	const insertOperations: InsertOperation[] = [];
	for (const [referenceNode, nodesToBeInserted] of insertionsMap) {
		const index = parentNode.statements.indexOf(referenceNode);
		if (index !== -1) {
			insertOperations.push({index, nodes: nodesToBeInserted});
		}
	}
	if (insertOperations.length > 0) {
		const newStatements = parentNode.statements.slice();

		// Sort the insert operations in descending order of index
		insertOperations.sort((a, b) => b.index - a.index);

		// Run insertions from the end to the beginning to avoid index shifts
		for (const {index, nodes} of insertOperations) {
			newStatements.splice(index + 1, 0, ...nodes);
		}

		if (ts.isBlock(parentNode)) {
			return nodeFactory.updateBlock(parentNode, newStatements);
		} else if (ts.isSourceFile(parentNode)) {
			return nodeFactory.updateSourceFile(parentNode, newStatements);
		}
	}
}
