import ts from "typescript";

export function collectIdentifiers(node: ts.SourceFile) {
	const declaredIdentifiers = new Set<string>();
	const extractDestructIdentifiers = (name: ts.BindingName, identifiers: Set<string>) => {
		if (ts.isIdentifier(name)) {
			identifiers.add(name.text);
		} else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
			for (const element of name.elements) {
				if (ts.isBindingElement(element)) {
					extractDestructIdentifiers(element.name, identifiers);
				}
			}
		}
	};
	const collectIdentifiers = (node: ts.Node) => {
		if (
			ts.isVariableDeclaration(node) ||
			ts.isFunctionDeclaration(node) ||
			ts.isClassDeclaration(node)
		) {
			if (node.name && ts.isIdentifier(node.name)) {
				declaredIdentifiers.add(node.name.text);
			}
		}

		if (ts.isParameter(node) || ts.isVariableDeclaration(node)) {
			extractDestructIdentifiers(node.name, declaredIdentifiers);
		}

		ts.forEachChild(node, collectIdentifiers);
	};

	ts.forEachChild(node, collectIdentifiers);

	return declaredIdentifiers;
}

interface FixRange {
	start: number;
	end: number;
	fix: Fix;
}

export function removeConflictingFixes(fixes: Set<Fix>) {
	const fixRanges: FixRange[] = [];
	for (const fix of fixes) {
		const ranges = fix.getAffectedSourceCodeRange();
		if (Array.isArray(ranges)) {
			for (const range of ranges) {
				fixRanges.push({
					start: range.start,
					end: range.end,
					fix: fix,
				});
			}
		} else {
			const {start, end} = ranges;
			fixRanges.push({
				start,
				end,
				fix: fix,
			});
		}
	}

	if (fixRanges.length === 0) return [];

	// Sort fixRanges by start position; if start is the same, sort by end position
	fixRanges.sort((a, b) => a.start - b.start || a.end - b.end);

	let currentEnd = fixRanges[0].end;

	for (let i = 1; i < fixRanges.length; i++) {
		const fixRange = fixRanges[i];

		if (fixRange.start < currentEnd) {
			// Conflict
			fixes.delete(fixRange.fix);
		}

		currentEnd = Math.max(currentEnd, fixRange.end);
	}
}
