import test from "ava";
import ts from "typescript";
import {findDirectives, collectPossibleDirectives} from
	"../../../../src/linter/ui5Types/directives.js";
import {LintMetadata} from "../../../../src/linter/LinterContext.js";

test("collectPossibleDirectives should find directives in source file", (t) => {
	const sourceCode = `// ui5lint-disable no-deprecated-api
const foo = 'bar';
// ui5lint-enable no-deprecated-api
	`;
	const sourceFile = ts.createSourceFile("test.ts", sourceCode, ts.ScriptTarget.ESNext, true);
	const directives = collectPossibleDirectives(sourceFile);

	t.is(directives.size, 2);
	const d = Array.from(directives);
	t.deepEqual(d[0], {
		action: "disable",
		scope: undefined,
		ruleNames: ["no-deprecated-api"],
		pos: 0,
		length: 36,
		line: 1,
		column: 37,
	});
	t.deepEqual(d[1], {
		action: "enable",
		scope: undefined,
		ruleNames: ["no-deprecated-api"],
		pos: 56,
		length: 35,
		line: 3,
		column: 36,
	});
});

test("collectPossibleDirectives should find same-line directives in source file", (t) => {
	const sourceCode =
		`/* ui5lint-disable */const foo = 'bar';/*ui5lint-enable*/`;
	const sourceFile = ts.createSourceFile("test.ts", sourceCode, ts.ScriptTarget.ESNext, true);
	const directives = collectPossibleDirectives(sourceFile);

	t.is(directives.size, 2);
	const d = Array.from(directives);
	t.deepEqual(d[0], {
		action: "disable",
		scope: undefined,
		ruleNames: [],
		pos: 0,
		length: 21,
		line: 1,
		column: 22,
	});
	t.deepEqual(d[1], {
		action: "enable",
		scope: undefined,
		ruleNames: [],
		pos: 39,
		length: 18,
		line: 1,
		column: 58,
	});
});

test("collectPossibleDirectives should find multi-line directives in source file", (t) => {
	const sourceCode =
		`/*
ui5lint-disable-next-line no-deprecated-api

--

De$criptive / comment *
*/
const foo = 'bar';`;
	const sourceFile = ts.createSourceFile("test.ts", sourceCode, ts.ScriptTarget.ESNext, true);
	const directives = collectPossibleDirectives(sourceFile);

	t.is(directives.size, 1);
	const d = Array.from(directives);
	t.deepEqual(d[0], {
		action: "disable",
		scope: "next-line",
		ruleNames: ["no-deprecated-api"],
		pos: 0,
		length: 78,
		line: 7,
		column: 3,
	});
});

test("collectPossibleDirectives should ignore line breaks after single-line directive in source file", (t) => {
	const sourceCode =
		`const foo = 'bar'; // ui5lint-disable-line -- description


`;
	const sourceFile = ts.createSourceFile("test.ts", sourceCode, ts.ScriptTarget.ESNext, true);
	const directives = collectPossibleDirectives(sourceFile);

	t.is(directives.size, 1);
	const d = Array.from(directives);
	t.deepEqual(d[0], {
		action: "disable",
		scope: "line",
		ruleNames: [],
		pos: 19,
		length: 38,
		line: 1,
		column: 58,
	});
});

runTests("js");
runTests("ts");

function runTests(suffix: "js" | "ts") {
	test(`findDirectives: Case 1 (${suffix})`, (t) => {
		const sourceCode = `// ui5lint-disable no-deprecated-api
const foo = 'bar';
// ui5lint-enable no-deprecated-api`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 2);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 2 (${suffix})`, (t) => {
		const sourceCode = `// ui5lint-disable no-deprecated-api
const foo = 'bar';
// ui5lint-enable no-deprecated-api`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 2);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 3 (${suffix})`, (t) => {
		const sourceCode = `// ui5lint-disable no-deprecated-api
function foo() {
    // Some code
}
// ui5lint-enable no-deprecated-api, no-globals`;

		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 2);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 4 (${suffix})`, (t) => {
		const sourceCode = `
function someFunction() {
    // ui5lint-disable-next-line no-deprecated-api
    someFunction2();
}`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 1);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 5 (${suffix})`, (t) => {
		const sourceCode = `
function someFunction() {
    someFunction2(); // ui5lint-disable-line no-deprecated-api
}`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 1);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 6 (${suffix})`, (t) => {
		const sourceCode = `
/*
 ui5lint-disable no-deprecated-api
 */
function someFunction() {
    // Some code
}
/*
 ui5lint-enable no-deprecated-api, no-globals
 */
`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 2);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 7 (${suffix})`, (t) => {
		const sourceCode = `
function someFunction() {
    /* 
     ui5lint-disable-next-line no-deprecated-api
     */
    someFunction2(); 
}`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 1);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 8 (${suffix})`, (t) => {
		const sourceCode = `
// ui5lint-disable no-deprecated-api
function someFunction1() {
    // Some code
}
function someFunction2() {
    // Some code
}
// ui5lint-enable no-deprecated-api, no-globals
function someFunction3() {
    // Some code
}`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 2);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 9 (${suffix})`, (t) => {
		const sourceCode = `
function someFunction() {
    someFunction2(); /* ui5lint-disable-line no-deprecated-api */
}`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 1);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 10 (${suffix})`, (t) => {
		const sourceCode = `
/*
 ui5lint-disable-next-line no-deprecated-api
 */
function deprecatedFunction9() {
    // Some code
}

/*
 ui5lint-enable no-deprecated-api, no-globals
 */`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 2);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 11 (${suffix})`, (t) => {
		const sourceCode = `
// ui5lint-enable no-deprecated-api -- my comment
/*
 ui5lint-disable-next-line no-deprecated-api -- my comment

 */
function deprecatedFunction9() {
    // Some code
    return;
    /*
	 ui5lint-enable no-deprecated-api, no-globals -- my other even longer
	 multiline comment with special * char$
	 */
}
`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 3);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 12 (${suffix})`, (t) => {
		const sourceCode = `
/* ui5lint-disable-next-line no-deprecated-api,
	no-globals
*/
function deprecatedFunction9() {
    // Some code
}`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 1);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 13 (${suffix})`, (t) => {
		const sourceCode = `
// ui5lint-disable-next-line no-deprecated-api,
// ui5lint-disable no-deprecated-api,no-globals
// ui5lint-enable no-deprecated-api ,no-globals
// ui5lint-disable no-deprecated-api , no-globals
function deprecatedFunction9() {
    // Some code
}`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 4);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 14 (${suffix})`, (t) => {
		const sourceCode = `
// ui5lint-disable no-deprecated-api
/*
 ui5lint-enable-next-line no-deprecated-api -- my comment

 */
function deprecatedFunction9() {
    // Some code
    return;
}
`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 2);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Case 15 (${suffix})`, (t) => {
		const sourceCode = `
// ui5lint-disable-next-line no-deprecated-api -- my comment
foo(); // ui5lint-enable-line
`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 2);
		t.snapshot(metadata.directives);
	});

	test(`findDirectives: Negative case 1 (${suffix})`, (t) => {
		// Directive must not be preceded by asterisk any non-whitespace characters
		const sourceCode = `
/*
 * ui5lint-disable-next-line no-deprecated-api
 */
function someFunction() {
	someFunction2();
}
`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 0);
	});

	test(`findDirectives: Negative case 2 (${suffix})`, (t) => {
		// Three slashes are invalid
		const sourceCode = `
/// ui5lint-disable-next-line no-deprecated-api
function someFunction() {
	someFunction2();
}
`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 0);
	});

	test(`findDirectives: Negative case 3 (${suffix})`, (t) => {
		// Incorrect prefix or action
		const sourceCode = `
// ui5-lint-disable
// ui5-linter-disable
// ui5-linter-disable
// ui5linter-disable
// lint-disable
// ui5-disable
// ui5lint-activate
// ui5lint disable
// ui5lint-disable-previous-line
// ui5lint-disable-line-next
// ui5lint-disable-next
function someFunction() {
	someFunction2();
}
`;
		const sourceFile = ts.createSourceFile(`test.${suffix}`, sourceCode, ts.ScriptTarget.ESNext, true);
		const metadata = {} as LintMetadata;
		findDirectives(sourceFile, metadata);
		t.is(metadata.directives.size, 0);
	});
}
