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

export function findDirectivesAroundNode(
	node: ts.Node, sourceText: string, possibleDirectives: Set<Directive>, confirmedDirectives: Set<Directive>
) {
	/*
		// This is a comment
		// ui5-lint-disable
		myCallExpression()
		// ui5-lint-enable
		// This is a comment
	*/
	for (const directive of possibleDirectives) {
		if (directive.pos >= node.getFullStart() && directive.pos + directive.length < node.getStart()) {
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
	// ui5lint-enable-line -- my comment
	/* ui5lint-enable-line -- my comment *\/
	/* ui5lint-disable
		no-deprecated-api,
		no-global
	*\/
*/
const disableCommentRegex = /\/[/*]\s*ui5lint-(enable|disable)((?:-next)?-line)?((?:\s+[\w-]+\s*,)*(?:\s*[\w-]+))?\s*(?:--.*)?(?:\*\/|$)/mg;

export interface Directive {
	action: "enable" | "disable";
	isLine: boolean;
	isNextLine: boolean;
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
	while ((match = disableCommentRegex.exec(text)) !== null) {
		const [, action, nextLineOrLine, rules] = match;
		const pos = match.index;
		const length = match[0].length;
		let ruleNames = rules?.split(",") ?? [];
		ruleNames = ruleNames.map((rule) => rule.trim());
		const isLine = nextLineOrLine === "-line";
		const isNextLine = nextLineOrLine === "-next-line";
		const {line, character: column} = sourceFile.getLineAndCharacterOfPosition(pos);

		comments.add({
			action: action as "enable" | "disable",
			isLine, isNextLine, ruleNames,
			pos, length,
			// Typescript positions are all zero-based
			line: line + 1,
			column: column + 1,
		});
	}
	return comments;
}
