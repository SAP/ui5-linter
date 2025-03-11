import anyTest, {TestFn} from "ava";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createMockedLinterModules, preprocessLintResultsForSnapshot} from "../linter/_linterHelper.js";
import type {UI5LinterEngine} from "../../../src/index.js";
import sinonGlobal, {SinonSpy} from "sinon";
import type {AutofixOptions, AutofixResult} from "../../../src/autofix/autofix.js";

const fixturesProjectsPath = fileURLToPath(new URL("../../fixtures/linter/projects", import.meta.url));

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
	linterEngine: UI5LinterEngine;
	autofixSpy: SinonSpy<[AutofixOptions], Promise<AutofixResult>>;
}>;

test.before(async (t) => {
	t.context.sinon = sinonGlobal.createSandbox();

	const {indexModule: {UI5LinterEngine}, autofixSpy} = await createMockedLinterModules();
	t.context.linterEngine = new UI5LinterEngine();
	t.context.autofixSpy = autofixSpy;
});
test.afterEach.always((t) => {
	t.context.sinon.restore();
});

test.serial("lint: All files of library with sap.ui.unified namespace", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "sap.ui.unified");
	const {linterEngine} = t.context;

	const res = await linterEngine.lint({
		rootDir: projectPath,
		fix: true,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));

	t.is(t.context.autofixSpy.callCount, 1);
	const autofixResult = await t.context.autofixSpy.getCall(0).returnValue;
	for (const [filePath, content] of autofixResult.entries()) {
		t.snapshot(content, `AutofixResult: ${filePath}`);
	}
});
