import test from "ava";
import JSTokenizer from "../../../../../src/linter/xmlTemplate/lib/JSTokenizer.js";

test("JSTokenizer: Basic values", (t) => {
	const res = JSTokenizer.parseJS(`{
		string: '123', number: 123, decimal: 1.23, boolean: true, null: null
	}`);
	t.deepEqual(res, {
		null: null,
		boolean: true,
		string: "123",
		number: 123,
		decimal: 1.23,
	});
});

test("JSTokenizer: Tab after unquoted key", (t) => {
	const res = JSTokenizer.parseJS(
		`{path\t: 'invoice>Status', formatter: 'ui5.walkthrough.model.formatter.statusText'}`);
	t.deepEqual(res, {
		path: "invoice>Status",
		formatter: "ui5.walkthrough.model.formatter.statusText",
	});
});

test("JSTokenizer: Tab after quoted key", (t) => {
	const res = JSTokenizer.parseJS(
		`{"path"\t: 'invoice>Status', formatter: 'ui5.walkthrough.model.formatter.statusText'}`);
	t.deepEqual(res, {
		path: "invoice>Status",
		formatter: "ui5.walkthrough.model.formatter.statusText",
	});
});

test("JSTokenizer: Not allowed", (t) => {
	t.throws(() => {
		JSTokenizer.parseJS(`{
			undefined: undefined
		}`);
	}, {
		message: `Unexpected 'u'`,
	});
});

test("JSTokenizer: __proto__ is not allowed", (t) => {
	t.throws(() => {
		JSTokenizer.parseJS(`{foo: '123', __proto__: { newProp: true }}`);
	}, {
		message: `Illegal key "__proto__"`,
	});
});

test("JSTokenizer: constructor is not allowed", (t) => {
	t.throws(() => {
		JSTokenizer.parseJS(`{foo: '123', constructor: { prototype: { newProp: true }}}`);
	}, {
		message: `Illegal key "constructor"`,
	});
});

test("JSTokenizer: Dangling comma", (t) => {
	t.throws(() => {
		JSTokenizer.parseJS(`{foo: '123',}`);
	}, {
		message: `Syntax error: Unexpected character '}'.

o: '123',}
         ^`,
	});
});
