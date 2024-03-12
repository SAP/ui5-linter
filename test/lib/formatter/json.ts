import anyTest, {TestFn} from "ava";
import {Json} from "../../../src/formatter/json.js";
import {LintResult} from "../../../src/detectors/AbstractDetector.js";

const test = anyTest as TestFn<{
	lintResults: LintResult[];
}>;

test.beforeEach((t) => {
	t.context.lintResults = [{
		filePath: "",
		messages: [{
			ruleId: "ui5-linter-no-deprecated-api",
			severity: 2,
			line: 5,
			column: 1,
			message: "Call to deprecated function 'attachInit' of class 'Core'",
			messageDetails: "(since 1.118) - Please use {@link sap.ui.core.Core.ready Core.ready} instead.",
		}],
		coverageInfo: [],
		errorCount: 0,
		fatalErrorCount: 0,
		warningCount: 0,
	}];
});

test("Test Json Formatter (with '--details true')", (t) => {
	const {lintResults} = t.context;
	const jsonFormatter = new Json();
	const jsonResult = jsonFormatter.format(lintResults, true);
	const parsedJson = JSON.parse(jsonResult); // fails if no valid JSON is returned

	t.notDeepEqual(parsedJson, lintResults,
		"Original lintResults and JSON-formatted ones have different structure");
	t.true(Object.prototype.hasOwnProperty.call(parsedJson[0], "filePath"),
		"The JSON-formatted lintResults contain the filePath property");
	t.true(Object.prototype.hasOwnProperty.call(parsedJson[0], "messages"),
		"The JSON-formatted lintResults contain the messages property");
	t.false(Object.prototype.hasOwnProperty.call(parsedJson[0], "coverageInfo"),
		"The JSON-formatted lintResults do NOT contain coverageInfo");
	t.true(Object.prototype.hasOwnProperty.call(parsedJson[0], "errorCount"),
		"The JSON-formatted lintResults contain the errorCount property");
	t.true(Object.prototype.hasOwnProperty.call(parsedJson[0], "fatalErrorCount"),
		"The JSON-formatted lintResults contain the fatalErrorCount property");
	t.true(Object.prototype.hasOwnProperty.call(parsedJson[0], "warningCount"),
		"The JSON-formatted lintResults contain the warningCount property");
	t.true(Object.prototype.hasOwnProperty.call(parsedJson[0].messages[0], "messageDetails"),
		"The messages property of the JSON-formatted lintResults contain the messageDetails property");
});

test("Test Json Formatter (with '--details false')", (t) => {
	const {lintResults} = t.context;
	const jsonFormatter = new Json();
	const jsonResult = jsonFormatter.format(lintResults, false);
	const parsedJson = JSON.parse(jsonResult); // fails if no valid JSON is returned

	t.false(Object.prototype.hasOwnProperty.call(parsedJson[0].messages[0], "messageDetails"),
		"The messages of the JSON-formatted lintResults do NOT contain the messageDetails property");
});
