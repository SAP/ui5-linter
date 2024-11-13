import anyTest, {TestFn} from "ava";
import esmock from "esmock";
import sinonGlobal, {SinonStub} from "sinon";
import {LintResult} from "../../../src/linter/LinterContext.js";
import {CoverageCategory} from "../../../src/linter/LinterContext.js";
import {LintMessageSeverity} from "../../../src/linter/messages.js";

const test = anyTest as TestFn<{
	lintResults: LintResult[];
	sinon: sinonGlobal.SinonSandbox;
	readFileStub: SinonStub;
	Coverage: typeof import("../../../src/formatter/coverage.js").Coverage;
}>;

test.beforeEach(async (t) => {
	const sinon = t.context.sinon = sinonGlobal.createSandbox();
	const lintResults: LintResult[] = [
		{
			filePath: "manifest.json",
			messages: [
				{
					ruleId: "async-component-flags",
					severity: 1,
					line: 17,
					column: 12,
					message: "<message>",
					messageDetails: "<details>",
				},
			],
			coverageInfo: [],
			errorCount: 0,
			warningCount: 1,
			fatalErrorCount: 0,
		},
		{
			filePath: "Test.js",
			messages: [
				{
					ruleId: "no-deprecated-api",
					severity: 2,
					line: 2,
					column: 9,
					message: "<message>",
					messageDetails: "<details>",
				},
				{
					ruleId: "no-globals",
					severity: 2,
					line: 2,
					column: 2,
					message: "<message>",
					messageDetails: "<details>",
				},
			],
			coverageInfo: [
				{
					category: CoverageCategory.CallExpressionUnknownType,
					line: 3,
					column: 2,
					message: "Unable to analyze this method call because the type of identifier in " +
						"\"unknownFunctionCall()\"\" could not be determined",
				},
			],
			errorCount: 2,
			warningCount: 0,
			fatalErrorCount: 0,
		},
	];
	t.context.lintResults = lintResults;

	t.context.readFileStub = sinon.stub().rejects(new Error("ENOENT: no such file or directory"));
	t.context.readFileStub.withArgs("manifest.json", {encoding: "utf-8"}).resolves(
		`{
	"_version": "1.61.0",
	"sap.app": {
		"id": "sap.ui.demo.todo",
		"type": "application"
	},
	"sap.ui5": {
		"dependencies": {
			"minUI5Version": "1.121.0",
			"libs": {
				"sap.ui.core": {}
			}
		},
		"rootView": {
			"viewName": "sap.ui.demo.todo.view.App",
			"type": "XML",
			"id": "app",
			"async": true
		}
	}
}
`
	);
	t.context.readFileStub.withArgs("Test.js", {encoding: "utf-8"}).resolves(
		`sap.ui.define(() => {
	sap.ui.getCore();
	unknownFunctionCall();
});
`
	);

	const {Coverage} = await esmock("../../../src/formatter/coverage.js", {
		"node:fs/promises": {
			readFile: t.context.readFileStub,
		},
	});
	t.context.Coverage = Coverage;
});

test.afterEach.always((t) => {
	t.context.sinon.restore();
});

test("Coverage Formatter", async (t) => {
	const {lintResults, Coverage} = t.context;
	const coverageFormatter = new Coverage();
	const reportDate = new Date(Date.parse("2024-01-01T01:23:45"));
	const coverageResult = await coverageFormatter.format(lintResults, reportDate);

	t.snapshot(coverageResult);
});

test("Error: Unknown severity", async (t) => {
	const {lintResults, Coverage} = t.context;
	const coverageFormatter = new Coverage();
	const reportDate = new Date(1731500927354);

	lintResults[0].messages[0].severity =
		3 as unknown as LintMessageSeverity; // Setting an invalid LintMessageSeverity value

	await t.throwsAsync(coverageFormatter.format(lintResults, reportDate), {
		message: "Unknown severity: 3",
	});
});
