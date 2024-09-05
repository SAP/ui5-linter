import test from "ava";
// import esmock, { MockFunction } from "esmock";
import ConfigManager from "../../../src/utils/ConfigManager.js";

test("Check config file", async (t) => {
	const confManager = new ConfigManager("ui5lint-custom.config.cjs",
		"./test/fixtures/linter/projects/com.ui5.troublesome.app/");

	const config = await confManager.getConfiguration();

	t.deepEqual(config, {
		ignores: [
			"!test/sap/m/visual/Wizard.spec.js",
			"test/**/*",
		],
	}, "The configuration is derived from the provided custom config file");
});

test("Check config file auto discovery", async (t) => {
	const confManager = new ConfigManager(undefined,
		"./test/fixtures/linter/projects/com.ui5.troublesome.app/");

	const config = await confManager.getConfiguration();

	t.deepEqual(config, {
		ignores: [
			"!test/sap/m/visual/Wizard.spec.js",
			"test/**/*",
		],
	}, "The configuration is derived from the discovered configuration file");
});
