import anyTest, {TestFn} from "ava";
import sinonGlobal from "sinon";
import esmock from "esmock";
import autofix, {AutofixResource, ChangeAction} from "../../../src/autofix/autofix.js";
import LinterContext from "../../../src/linter/LinterContext.js";
import {MESSAGE} from "../../../src/linter/messages.js";
import type {addDependencies} from "../../../src/autofix/solutions/amdImports.js";
import {createResource} from "@ui5/fs/resourceFactory";

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
	addDependenciesStub: sinonGlobal.SinonStub<Parameters<typeof addDependencies>, ReturnType<typeof addDependencies>>;
	autofix: typeof autofix;
	linterContext: LinterContext;
}>;

test.beforeEach(async (t) => {
	t.context.sinon = sinonGlobal.createSandbox();

	t.context.addDependenciesStub = t.context.sinon.stub();

	t.context.autofix = await esmock("../../../src/autofix/autofix.js", {
		"../../../src/autofix/solutions/amdImports.ts": {
			addDependencies: t.context.addDependenciesStub,
		},
	});

	t.context.linterContext = new LinterContext({
		rootDir: "/",
		fix: true,
	});
});

test.afterEach.always((t) => {
	t.context.sinon.restore();
});

test("autofix: Parsing error after applying fixes", async (t) => {
	const {autofix, linterContext, addDependenciesStub} = t.context;

	addDependenciesStub.callsFake((defineCall, moduleDeclarationInfo, changeSet, _resourcePath) => {
		// Pushing an invalid change set to trigger a parsing error
		changeSet.push({
			action: ChangeAction.INSERT,
			start: 1,
			value: "(",
		});
	});

	const resources = new Map<string, AutofixResource>();
	resources.set("/resources/file.js", {
		resource: createResource({
			path: "/resources/file.js",
			string: "sap.ui.define(() => new sap.m.Button())",
		}),
		messages: [
			// Noter: Message details don't need to be correct in this test case
			// as we stub the addDependencies function
			{
				id: MESSAGE.NO_GLOBALS,
				position: {
					line: 1,
					column: 1,
				},
				args: {},
				fixHints: {
					moduleName: "sap/m/Button",
				},
			},
		],
	});

	const result = await autofix({
		rootDir: "/",
		context: linterContext,
		resources,
	});

	t.truthy(result);
	t.deepEqual(Array.from(result.keys()), []);

	t.deepEqual(linterContext.generateLintResults(), [
		{
			coverageInfo: [],
			errorCount: 1,
			fatalErrorCount: 1,
			filePath: "/resources/file.js",
			messages: [
				{
					column: undefined,
					fatal: true,
					line: undefined,
					message: "Syntax error after applying autofix for '/resources/file.js': ')' expected.",
					ruleId: "parsing-error",
					severity: 2,
				},
			],
			warningCount: 0,
		},
	]);
});
