import anyTest, {TestFn} from "ava";
import sinonGlobal from "sinon";
import LinterContext from "../../../src/linter/LinterContext.js";
import {MESSAGE} from "../../../src/linter/messages.js";

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
	linterContext: LinterContext;
}>;

test.before((t) => {
	t.context.sinon = sinonGlobal.createSandbox();

	t.context.linterContext = new LinterContext({
		rootDir: "/",
		namespace: "namespace",
	});

	// Propagate with findings in every 10th row up to 100
	for (let i = 1; i <= 10; i++) {
		t.context.linterContext.addLintingMessage("/foo.js", MESSAGE.DEPRECATED_API_ACCESS, {
			apiName: "foo",
			details: "bar",
		}, {
			line: i * 10,
			column: 10,
		});
	}
});

test.after.always((t) => {
	t.context.sinon.restore();
});

// Directives are generally assumed to be provided *in order* (= sorted by position)

test("generateLintResult: Disable and enable", (t) => {
	const {linterContext} = t.context;
	linterContext.getMetadata("/foo.js").directives = new Set([
		{ // Ignore line 10 finding
			action: "disable",
			isLine: false,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 5,
			column: 1,
		},
		{ // Report line 20 finding
			action: "enable",
			isLine: false,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 15,
			column: 1,
		},
		{ // Ignore all other findings
			action: "disable",
			isLine: false,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 25,
			column: 1,
		},
	]);

	const res = linterContext.generateLintResult("/foo.js");
	t.snapshot(res);
});

test("generateLintResult: Disable next line", (t) => {
	const {linterContext} = t.context;
	linterContext.getMetadata("/foo.js").directives = new Set([
		{ // Ignore line 10 finding
			action: "disable",
			isLine: false,
			isNextLine: true,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 9,
			column: 1,
		},
		{ // No finding in next line => should have no effect
			action: "disable",
			isLine: false,
			isNextLine: true,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 15,
			column: 1,
		},
		{ // No finding in next line => should have no effect
			action: "disable",
			isLine: false,
			isNextLine: true,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 28,
			column: 1,
		},
		{ // No finding in next line => should have no effect
			action: "disable",
			isLine: false,
			isNextLine: true,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 31,
			column: 1,
		},
		{ // No finding in next line (but in the same line) => should have no effect
			action: "disable",
			isLine: false,
			isNextLine: true,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 40,
			column: 1,
		},
	]);

	const res = linterContext.generateLintResult("/foo.js");
	t.snapshot(res);
});

test("generateLintResult: Disable line", (t) => {
	const {linterContext} = t.context;
	linterContext.getMetadata("/foo.js").directives = new Set([
		{ // Ignore line 10 finding
			action: "disable",
			isLine: true,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 10,
			column: 1, // Before finding
		},
		{ // Ignore line 20 finding
			action: "disable",
			isLine: true,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 20,
			column: 100, // After finding
		},
		{ // Ignore line 30 finding
			action: "disable",
			isLine: true,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 30,
			column: 100, // After finding
		},
		{ // Ignore line 40 finding
			action: "disable",
			isLine: true,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 40,
			column: 1,
		},
		{ // Actually report line 40 finding
			action: "enable",
			isLine: true,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 40,
			column: 2,
		},
	]);

	const res = linterContext.generateLintResult("/foo.js");
	t.snapshot(res);
});

test("generateLintResult: Multiple disables in same line", (t) => {
	const {linterContext} = t.context;
	linterContext.getMetadata("/foo.js").directives = new Set([
		{ // Ignore line 10 finding
			action: "disable",
			isLine: false,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 10,
			column: 1, // Before finding
		},
		{ // Actually report it
			action: "enable",
			isLine: false,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 10,
			column: 2, // Before finding
		},
		{ // Ignore everything after
			action: "disable",
			isLine: false,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 10,
			column: 11, // After finding
		},
	]);

	const res = linterContext.generateLintResult("/foo.js");
	t.snapshot(res);
});

test("generateLintResult: Edge positions", (t) => {
	const {linterContext} = t.context;
	linterContext.getMetadata("/foo.js").directives = new Set([
		{ // Ignore line 10 finding
			action: "disable",
			isLine: false,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 10,
			column: 9, // Right before finding
		},
		{ // Ignore line 10 finding
			action: "enable",
			isLine: false,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 10,
			column: 11, // Right after finding
		},
		{ // Ignore line 20 finding
			action: "disable",
			isLine: true,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 20,
			column: 9, // Right before finding
		},
		{ // Ignore line 30 finding
			action: "disable",
			isLine: true,
			isNextLine: false,
			ruleNames: ["no-deprecated-api"],
			pos: -1, // Ignored
			length: -1, // Ignored
			line: 30,
			column: 11, // Right after finding
		},
	]);

	const res = linterContext.generateLintResult("/foo.js");
	t.snapshot(res);
});
