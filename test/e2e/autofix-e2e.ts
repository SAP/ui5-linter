import anyTest, {TestFn} from "ava";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {esmockDeprecationText, preprocessLintResultsForSnapshot} from "../lib/linter/_linterHelper.js";
import {UI5LinterEngine} from "../../src/index.js";
import {AutofixOptions, AutofixResult} from "../../src/autofix/autofix.js";
import sinonGlobal, {SinonSpy} from "sinon";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesBasePath = path.join(__dirname, "..", "fixtures", "linter");
const fixturesProjectsPath = path.join(fixturesBasePath, "projects");

const test = anyTest as TestFn<{
	linterEngine: UI5LinterEngine;
	autofixSpy: SinonSpy<[AutofixOptions], Promise<AutofixResult>>;
}>;

test.beforeEach(async (t) => {
	const {indexModule: {UI5LinterEngine}, autofixModule} = await esmockDeprecationText();
	t.context.linterEngine = new UI5LinterEngine();
	t.context.autofixSpy = autofixModule.default;
});
test.afterEach.always(() => {
	sinonGlobal.restore();
});

test.serial("autofix: com.ui5.troublesome.app", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const {linterEngine, autofixSpy} = t.context;

	const res = await linterEngine.lint({
		rootDir: projectPath,
		filePatterns: [],
		coverage: true,
		details: true,
		fix: true,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));

	t.is(autofixSpy.callCount, 1);
	const autofixResult = await autofixSpy.getCall(0).returnValue;
	for (const [filePath, content] of autofixResult.entries()) {
		t.snapshot(content, `AutofixResult: ${filePath}`);
	}
});
