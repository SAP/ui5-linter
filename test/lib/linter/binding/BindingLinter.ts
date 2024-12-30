import anyTest, {TestFn} from "ava";
import BindingLinter from "../../../../src/linter/binding/BindingLinter.js";
import LinterContext from "../../../../src/linter/LinterContext.js";

const test = anyTest as TestFn<{
	linterContext: LinterContext;
	bindingLinter: BindingLinter;
}>;

test.beforeEach((t) => {
	t.context.linterContext = new LinterContext({
		rootDir: "/",
	});
	t.context.bindingLinter = new BindingLinter("/test.js", t.context.linterContext);
});

test("XML Property Binding: Global Formatter", (t) => {
	const {bindingLinter, linterContext} = t.context;

	// Accessing formatter functions using global notation is no longer supported
	bindingLinter.lintPropertyBinding(`{
		path: 'invoice>Status',
		formatter: 'ui5.walkthrough.model.formatter.statusText'
	}`, [], {line: 1, column: 1});

	t.snapshot(linterContext.generateLintResult("/test.js"));
});

test("XML Property Binding: Global Formatter with bind call", (t) => {
	const {bindingLinter, linterContext} = t.context;

	// Accessing formatter functions using global notation is no longer supported
	bindingLinter.lintPropertyBinding(`{
		path: 'invoice>Status',
		formatter: 'ui5.walkthrough.model.formatter.statusText.bind($controller)'
	}`, [], {line: 1, column: 1});

	t.snapshot(linterContext.generateLintResult("/test.js"));
});

test("XML Property Binding: Controller Formatter", (t) => {
	const {bindingLinter, linterContext} = t.context;

	// Formatter functions on the controller can be referenced using a dot "." prefix
	bindingLinter.lintPropertyBinding(`{
		path: 'invoice>Status',
		formatter: '.statusText'
	}`, [{
		moduleName: "some/formatter/module",
		variableName: "unusedFormatter",
	}], {line: 1, column: 1});

	t.snapshot(linterContext.generateLintResult("/test.js"));
});

test("XML Property Binding: Imported Formatter", (t) => {
	const {bindingLinter, linterContext} = t.context;

	// Formatter functions of properly imported modules can be accessed using the variable name
	bindingLinter.lintPropertyBinding(`{
		path: 'invoice>Status',
		formatter: 'Formatter.statusText'
	}`, [{
		moduleName: "some/formatter/module",
		variableName: "Formatter",
	}], {line: 1, column: 1});

	t.snapshot(linterContext.generateLintResult("/test.js"));
});

test("XML Property Binding: Imported Formatter with bind call", (t) => {
	const {bindingLinter, linterContext} = t.context;

	// Formatter functions of properly imported modules can be accessed using the variable name
	bindingLinter.lintPropertyBinding(`{
		path: 'invoice>Status',
		formatter: 'Formatter.statusText.bind($controller)'
	}`, [{
		moduleName: "some/formatter/module",
		variableName: "Formatter",
	}], {line: 1, column: 1});

	t.snapshot(linterContext.generateLintResult("/test.js"));
});

test("XML Property Binding: Global Event Handler", (t) => {
	const {bindingLinter, linterContext} = t.context;

	bindingLinter.lintPropertyBinding(`{
		path: '/firstName',
		events: {
			dataRequested: 'global.onMyDataRequested'
		}
	}`, [], {line: 1, column: 1});

	t.snapshot(linterContext.generateLintResult("/test.js"));
});

test("XML Property Binding: Controller Event Handler", (t) => {
	const {bindingLinter, linterContext} = t.context;

	bindingLinter.lintPropertyBinding(`{
		path: '/firstName',
		events: {
			dataRequested: '.onMyDataRequested'
		}
	}`, [], {line: 1, column: 1});

	t.snapshot(linterContext.generateLintResult("/test.js"));
});

test("XML Property Binding: Imported Event Handler", (t) => {
	const {bindingLinter, linterContext} = t.context;

	bindingLinter.lintPropertyBinding(`{
		path: '/firstName',
		events: {
			dataRequested: 'Handler.onMyDataRequested'
		}
	}`, [{
		moduleName: "some/event/handler",
		variableName: "Handler",
	}], {line: 1, column: 1});

	t.snapshot(linterContext.generateLintResult("/test.js"));
});
