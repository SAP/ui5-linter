import anyTest, {TestFn} from "ava";
import {Markdown} from "../../../src/formatter/markdown.js";
import {LintResult, LintMessageSeverity} from "../../../src/linter/LinterContext.js";

const test = anyTest as TestFn<{
	lintResults: LintResult[];
}>;

test.beforeEach((t) => {
	t.context.lintResults = [{
		filePath: "",
		messages: [{
			ruleId: "ui5-linter-no-deprecated-api",
			severity: LintMessageSeverity.Error,
			line: 5,
			column: 1,
			message: "Call to deprecated function 'attachInit' of class 'Core'",
			messageDetails: "(since 1.118) - Please use {@link sap.ui.core.Core.ready Core.ready} instead.",
		}],
		coverageInfo: [],
		errorCount: 1,
		fatalErrorCount: 0,
		warningCount: 0,
	}];
});

test("Test Markdown Formatter (with '--details true')", (t) => {
	const {lintResults} = t.context;
	const markdownFormatter = new Markdown();
	const markdownResult = markdownFormatter.format(lintResults, true);

	t.true(markdownResult.includes("# UI5 Linter Report"),
		"The Markdown output includes the main header");
	t.true(markdownResult.includes("🔴 [5:1] Call to deprecated function 'attachInit' of class 'Core'"),
		"The Markdown output includes the error message with correct formatting");
	t.true(markdownResult.includes("## Summary"),
		"The Markdown output includes a summary section");
	t.true(markdownResult.includes("- Total problems: 1"),
		"The Markdown output includes the total problem count");
	t.true(markdownResult.includes("  - Errors: 1"),
		"The Markdown output includes the error count");
	t.true(markdownResult.includes("  - Warnings: 0"),
		"The Markdown output includes the warning count");
});

test("Test Markdown Formatter (with '--details false')", (t) => {
	const {lintResults} = t.context;
	const markdownFormatter = new Markdown();
	const markdownResult = markdownFormatter.format(lintResults, false);

	t.true(markdownResult.includes("🔴 [5:1] Call to deprecated function 'attachInit' of class 'Core'"),
		"The Markdown output includes the error message with correct formatting");
	t.false(markdownResult.includes("**Details:**"),
		"The Markdown output does not include the message details");
	t.true(markdownResult.includes("**Note:** Use `ui5lint --details` to show more information about the findings."),
		"The Markdown output includes a note about using --details");
});

test("Test Markdown Formatter with multiple files and message types", (t) => {
	const lintResults: LintResult[] = [
		{
			filePath: "",
			messages: [
				{
					ruleId: "rule1",
					severity: LintMessageSeverity.Error,
					line: 1,
					column: 1,
					message: "Error message",
				},
				{
					ruleId: "rule2",
					severity: LintMessageSeverity.Warning,
					line: 2,
					column: 2,
					message: "Warning message",
				},
			],
			coverageInfo: [],
			errorCount: 1,
			fatalErrorCount: 0,
			warningCount: 1,
		},
		{
			filePath: "",
			messages: [
				{
					ruleId: "rule3",
					severity: LintMessageSeverity.Error,
					line: 3,
					column: 3,
					message: "Another error message",
				},
			],
			coverageInfo: [],
			errorCount: 1,
			fatalErrorCount: 0,
			warningCount: 0,
		},
	];

	const markdownFormatter = new Markdown();
	const markdownResult = markdownFormatter.format(lintResults, false);

	t.true(markdownResult.includes("🔴 [1:1] Error message"),
		"The Markdown output includes the error message for file1");
	t.true(markdownResult.includes("🟡 [2:2] Warning message"),
		"The Markdown output includes the warning message for file1");
	t.true(markdownResult.includes("🔴 [3:3] Another error message"),
		"The Markdown output includes the error message for file2");
	t.true(markdownResult.includes("- Total problems: 3"),
		"The Markdown output includes the correct total problem count");
	t.true(markdownResult.includes("  - Errors: 2"),
		"The Markdown output includes the correct error count");
	t.true(markdownResult.includes("  - Warnings: 1"),
		"The Markdown output includes the correct warning count");
});
