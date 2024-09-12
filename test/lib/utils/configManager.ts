import test from "ava";
// import esmock, { MockFunction } from "esmock";
import ConfigManager from "../../../src/utils/ConfigManager.js";

test("Check config file", async (t) => {
	const confManager = new ConfigManager("./test/fixtures/linter/projects/com.ui5.troublesome.app/",
		"ui5lint-custom.config.cjs");

	const config = await confManager.getConfiguration();

	t.deepEqual(config, {
		ignores: [
			"test/**/*",
			"!test/sap/m/visual/Wizard.spec.js",
		],
	}, "The configuration is derived from the provided custom config file");
});

test("Check config file auto discovery", async (t) => {
	const confManager = new ConfigManager("./test/fixtures/linter/projects/com.ui5.troublesome.app/");

	const config = await confManager.getConfiguration();

	t.deepEqual(config, {
		ignores: [
			"test/**/*",
			"!test/sap/m/visual/Wizard.spec.js",
		],
	}, "The configuration is derived from the discovered configuration file");
});

test("Throws an error if config file has Syntax errors", async (t) => {
	const confManager = new ConfigManager(
		"./test/fixtures/linter/projects/com.ui5.troublesome.app/", "ui5lint-custom-broken.config.cjs");

	await t.throwsAsync(confManager.getConfiguration());
});

test("Resolves to an empty config if default module is not found", async (t) => {
	const confManager = new ConfigManager(
		"./test/fixtures/linter/projects/library.with.custom.paths/");

	const config = await confManager.getConfiguration();

	t.deepEqual(config, {}, "An empty configuration gets returned");
});
