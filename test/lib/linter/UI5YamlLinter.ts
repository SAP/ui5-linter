import test from "ava";
import UI5YamlLinter from "../../../src/linter/yaml/UI5YamlLinter.js";
import LinterContext from "../../../src/linter/LinterContext.js";

test("Test UI5YamlLinter report (parsing and analyzing)", async (t) => {
	/* Mock resource content of ui5.yaml file,
	(formatted as used in src/linter/yaml/linter.ts)
	(contains relevant 'framework' property and 'libraries' sub-property),
	(contains only deprecated libraries) */
	const resourceContent =
`specVersion: '3.0'
metadata:
  name: ava-test-ui5yamllinter
type: application
framework:
  name: OpenUI5
  version: "1.121.0"
  libraries:
    - name: sap.ca.scfld.md
    - name: sap.ca.ui
    - name: sap.fe.common`;

	const resourcePath = "/ui5.yaml";
	const projectPath = "test.ui5yamllinter";
	const context = new LinterContext({rootDir: projectPath});

	// Create UI5YamlLinter instance with resource content
	const linter = new UI5YamlLinter(resourcePath, resourceContent, context);
	// Run UI5YamlLinter report
	await linter.lint();

	const messages = context.getLintingMessages("/ui5.yaml");

	// Test returned messages
	t.is(messages.length, 3, "Detection of 3 deprecated libraries expected");

	// Test each message
	t.is(messages[0].ruleId, "ui5-linter-no-deprecated-api", `RuleId is correct`);
	t.is(messages[0].message, `Use of deprecated library 'sap.ca.scfld.md'`, `Message is correct`);
	t.is(messages[0].column, 7, `Column is correct`);
	t.is(messages[0].line, 9, `Line is correct`);

	t.is(messages[1].ruleId, "ui5-linter-no-deprecated-api", `RuleId is correct`);
	t.is(messages[1].message, `Use of deprecated library 'sap.ca.ui'`, `Message is correct`);
	t.is(messages[1].column, 7, `Column is correct`);
	t.is(messages[1].line, 10, `Line is correct`);

	t.is(messages[2].ruleId, "ui5-linter-no-deprecated-api", `RuleId is correct`);
	t.is(messages[2].message, `Use of deprecated library 'sap.fe.common'`, `Message is correct`);
	t.is(messages[2].column, 7, `Column is correct`);
	t.is(messages[2].line, 11, `Line is correct`);
});
