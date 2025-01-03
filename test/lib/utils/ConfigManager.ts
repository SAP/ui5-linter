import test from "ava";
// import esmock, { MockFunction } from "esmock";
import ConfigManager from "../../../src/utils/ConfigManager.js";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesBasePath = path.join(__dirname, "..", "..", "fixtures", "linter");
const fixturesProjectsPath = path.join(fixturesBasePath, "projects");

test("Check config file", async (t) => {
	const confManager = new ConfigManager(
		path.join(fixturesProjectsPath, "com.ui5.troublesome.app"),
		"ui5lint-custom.config.cjs");

	const config = await confManager.getConfiguration();

	t.deepEqual(config, {
		ignores: [
			"webapp/test/**/*",
			"!webapp/test/integration/opaTests.qunit.js",
			"ui5.yaml",
		],
	}, "The configuration is derived from the provided custom config file");
});

test("Check config file auto discovery", async (t) => {
	const confManager = new ConfigManager(
		path.join(fixturesProjectsPath, "com.ui5.troublesome.app"));

	const config = await confManager.getConfiguration();

	t.deepEqual(config, {
		files: [
			"webapp/**/*",
		],
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
		path.join(fixturesProjectsPath, "library.with.custom.paths/"));

	const config = await confManager.getConfiguration();

	t.deepEqual(config, {}, "An empty configuration gets returned");
});

test("Check config file with absolute path", async (t) => {
	const confManager = new ConfigManager(
		path.join(fixturesProjectsPath, "com.ui5.troublesome.app"), "ui5lint-custom.config.cjs");

	const config = await confManager.getConfiguration();

	t.deepEqual(config, {
		ignores: [
			"webapp/test/**/*",
			"!webapp/test/integration/opaTests.qunit.js",
			"ui5.yaml",
		],
	}, "The configuration is derived from the provided custom config file");
});

test("Check files property", async (t) => {
	const confManager = new ConfigManager(
		path.join(fixturesProjectsPath, "com.ui5.troublesome.app"));

	const config = await confManager.getConfiguration();

	t.deepEqual(config, {
		files: [
			"webapp/**/*",
		],
		ignores: [
			"test/**/*",
			"!test/sap/m/visual/Wizard.spec.js",
		],
	}, "The configuration is derived from the provided custom config file");
});
