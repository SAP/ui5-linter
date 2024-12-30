import anyTest, {TestFn} from "ava";
import BindingLinter from "../../../../src/linter/binding/BindingLinter.js";
import LinterContext from "../../../../src/linter/LinterContext.js";

const test = anyTest as TestFn<{
	linterContext: LinterContext;
	bindingLinter: BindingLinter;
}>;

test.before((t) => {
	t.context.linterContext = new LinterContext({
		rootDir: "/",
	});
	t.context.bindingLinter = new BindingLinter("/test.js", t.context.linterContext);
});

test("XML Binding: Formatter", (t) => {
	const {bindingLinter} = t.context;

	// Formatters using global notation are no longer supported.
	bindingLinter.lintBinding(`{
		path: 'invoice>Status',
		formatter: 'ui5.walkthrough.model.formatter.statusText'
	}`, []);

	t.pass();
});
