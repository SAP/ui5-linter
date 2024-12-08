import anyTest, {TestFn} from "ava";
import {Markdown} from "../../../src/formatter/markdown.js";
import {LintResult} from "../../../src/linter/LinterContext.js";
import {LintMessageSeverity} from "../../../src/linter/messages.js";

const test = anyTest as TestFn<{
	lintResults: LintResult[];
}>;

test.beforeEach((t) => {
	t.context.lintResults = [
		{
			filePath: "webapp/Component.js",
			messages: [
				{
					ruleId: "rule1",
					severity: LintMessageSeverity.Error,
					line: 1,
					column: 1,
					message: "Error message",
					messageDetails: "Message details",
				},
				{
					ruleId: "rule2",
					severity: LintMessageSeverity.Warning,
					line: 2,
					column: 2,
					message: "Warning message",
					messageDetails: "Message details",
				},
			],
			coverageInfo: [],
			errorCount: 1,
			fatalErrorCount: 0,
			warningCount: 1,
		},
		{
			filePath: "webapp/Main.controller.js",
			messages: [
				{
					ruleId: "rule3",
					severity: LintMessageSeverity.Error,
					line: 11,
					column: 3,
					message: "Another error message",
					messageDetails: "Message details",
				},
				{
					ruleId: "rule3",
					severity: LintMessageSeverity.Error,
					line: 12,
					column: 3,
					message: "Another error message",
					messageDetails: "Message details",
					fatal: true,
				},
				{
					ruleId: "rule3",
					severity: LintMessageSeverity.Error,
					line: 3,
					column: 6,
					message: "Another error message",
					messageDetails: "Message details",
					fatal: true,
				},
				{
					ruleId: "rule3",
					severity: LintMessageSeverity.Warning,
					line: 12,
					column: 3,
					message: "Another error message",
					messageDetails: "Message details",
				},
				{
					ruleId: "rule3",
					severity: LintMessageSeverity.Error,
					line: 11,
					column: 2,
					message: "Another error message",
					messageDetails: "Message details",
				},
			],
			coverageInfo: [],
			errorCount: 4,
			fatalErrorCount: 2,
			warningCount: 1,
		},
	];
});

test("Default", (t) => {
	const {lintResults} = t.context;

	const markdownFormatter = new Markdown();
	const markdownResult = markdownFormatter.format(lintResults, false, "1.2.3");

	t.snapshot(markdownResult);
});

test("Details", (t) => {
	const {lintResults} = t.context;

	const markdownFormatter = new Markdown();
	const markdownResult = markdownFormatter.format(lintResults, true, "1.2.3");

	t.snapshot(markdownResult);
});

test("No findings", (t) => {
	const markdownFormatter = new Markdown();
	const markdownResult = markdownFormatter.format([], true, "1.2.3");

	t.snapshot(markdownResult);
});
