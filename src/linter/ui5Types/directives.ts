import ts from "typescript";
import {LintMetadata} from "../LinterContext.js";

export function findDirectives(sourceFile: ts.SourceFile, metadata: LintMetadata) {
	metadata.directives = new Set<Directive>();

	const possibleDirectives = collectPossibleDirectives(sourceFile);
	if (possibleDirectives.size === 0) {
		return;
	}
	const sourceText = sourceFile.getFullText();

	traverseAndFindDirectives(sourceFile, sourceText, possibleDirectives, metadata.directives);
}

function traverseAndFindDirectives(
	node: ts.Node, sourceText: string, possibleDirectives: Set<Directive>, confirmedDirectives: Set<Directive>
) {
	findDirectivesAroundNode(node, sourceText, possibleDirectives, confirmedDirectives);
	node.getChildren().forEach((child) => {
		traverseAndFindDirectives(child, sourceText, possibleDirectives, confirmedDirectives);
	});
}

function findDirectivesAroundNode(
	node: ts.Node, sourceText: string, possibleDirectives: Set<Directive>, confirmedDirectives: Set<Directive>
) {
	/*
		// This is a comment
		// ui5lint-disable
		myCallExpression()
		// ui5lint-enable
		// This is a comment
	*/
	for (const directive of possibleDirectives) {
		if (directive.pos >= node.getFullStart() && directive.pos + directive.length <= node.getStart()) {
			const leadingComments = ts.getLeadingCommentRanges(sourceText, node.getFullStart());
			if (leadingComments?.length) {
				leadingComments.some((comment) => {
					if (comment.pos === directive.pos) {
						possibleDirectives.delete(directive);
						confirmedDirectives.add(directive);
						return true;
					}
					return false;
				});
				break;
			}
		} else if (directive.pos > node.getEnd()) {
			const trailingComments = ts.getTrailingCommentRanges(sourceText, node.getEnd());
			if (trailingComments?.length) {
				trailingComments.some((comment) => {
					if (comment.pos === directive.pos && comment.end === directive.pos + directive.length) {
						possibleDirectives.delete(directive);
						confirmedDirectives.add(directive);
						return true;
					}
					return false;
				});
				break;
			}
		}
	}
}

/* Match things like:
	// ui5lint-disable-next-line no-deprecated-api, no-global
	// ui5lint-enable-next-line
	// ui5lint-enable-line
	// ui5lint-enable-line -- my description
	/* ui5lint-enable-line -- my description *\/
	/* ui5lint-disable
		no-deprecated-api,
		no-global
	*\/

	Must not match things like:
	````
	// ui5lint-disable-next-line -- my description
	expression();
	````
	The above is a single line comment with a description followed by some code in the next line.

	The regex below is designed to match single- and multi-line comments, however it splits both
	cases into basically two regex combined with an OR operator.
	If we would try to match the above with a single regex instead (matching /* and // simultaneously),
	it would be impossible to know whether the code in the second line is part of the directive's description or not.
*/
/* eslint-disable max-len */
const directiveRegex =
/*  | ----------------------------------------------- Multi-line comments -------------------------------------------- | ------------------------------------------ Single-line comments ------------------------------------| */
	/\/\*\s*ui5lint-(enable|disable)(?:-((?:next-)?line))?((?:\s+[\w-]+\s*,)*(?:\s*[\w-]+))?\s*,?\s*(?:--[\s\S]*?)?\*\/|\/\/\s*ui5lint-(enable|disable)(?:-((?:next-)?line))?((?:\s+[\w-]+\s*,)*(?:\s*[\w-]+))?\s*,?\s*(?:--.*)?$/mg;
/*                  |CG #1: action |    | CG #2: scope    |  CG #3: rules                 |Dangling,| Description      |               |CG #4: action |    | CG #5: scope    | CG #6: rules                  |Dangling,| Description | */
/* eslint-enable max-len */

export type DirectiveAction = "enable" | "disable";
export type DirectiveScope = "line" | "next-line" | undefined;
export interface Directive {
	action: DirectiveAction;
	scope: DirectiveScope;
	ruleNames: string[];
	pos: number;
	length: number;
	line: number;
	column: number;
}

export function collectPossibleDirectives(sourceFile: ts.SourceFile) {
	const text = sourceFile.getFullText();
	let match;
	const comments = new Set<Directive>();
	while ((match = directiveRegex.exec(text)) !== null) {
		const action = (match[1] ?? match[4]) as DirectiveAction;
		const scope = (match[2] ?? match[5]) as DirectiveScope;
		const rules = match[3] ?? match[6];

		const pos = match.index;
		const length = match[0].length;
		let ruleNames = rules?.split(",") ?? [];
		ruleNames = ruleNames.map((rule) => rule.trim());

		const {line, character: column} = sourceFile.getLineAndCharacterOfPosition(pos + length);
		comments.add({
			action,
			scope, ruleNames,
			pos, length,
			// Typescript positions are all zero-based
			line: line + 1,
			column: column + 1,
		});
	}
	return comments;
}
