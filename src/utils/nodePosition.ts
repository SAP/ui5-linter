import ts from "typescript";
import type {PositionRange} from "../linter/LinterContext.js";
import type {TraceMap} from "@jridgewell/trace-mapping";
import {
	originalPositionFor,
	GREATEST_LOWER_BOUND,
	LEAST_UPPER_BOUND,
} from "@jridgewell/trace-mapping";

export function getPositionsForNode({node, sourceFile, traceMap, resourcePath}: {
	node: ts.Node;
	resourcePath: string;
	sourceFile?: ts.SourceFile;
	traceMap?: TraceMap;
}): PositionRange {
	if (!sourceFile) {
		throw new Error(`No source file available for file ${resourcePath}`);
	}

	// Typescript positions are all zero-based
	const {line, character: column} = sourceFile.getLineAndCharacterOfPosition(node.getStart());
	const returnStatement = {start: {line, column}};

	if (traceMap) {
		// trace-mapping's originalPositionFor uses one-based lines and zero-based columns for input and output
		let tracedPos = originalPositionFor(traceMap, {
			line: line + 1,
			column,
			bias: GREATEST_LOWER_BOUND,
		});

		if (tracedPos.line === null) {
			// No source map found at or before the given position.
			// Try again with the least upper bound (i.e. the first mapping after the given position)
			tracedPos = originalPositionFor(traceMap, {
				line: line + 1,
				column,
				bias: LEAST_UPPER_BOUND,
			});
		}

		if (tracedPos.line === null) {
			throw new Error(
				`Failed to map back to source: ${sourceFile.fileName} ` +
				`(line: ${line + 1}, column: ${column + 1})`);
		}
		returnStatement.start = {
			line: tracedPos.line - 1, // Subtract 1 again to restore zero-based lines to match TypeScript output
			column: tracedPos.column,
		};
	}

	returnStatement.start.line += 1;
	returnStatement.start.column += 1;

	return returnStatement;
}
