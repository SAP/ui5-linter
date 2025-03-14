import test from "ava";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
	preprocessLintResultsForSnapshot,
} from "./linter/_linterHelper.js";
import {ui5lint} from "../../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesBasePath = path.join(__dirname, "..", "fixtures", "linter");
const fixturesProjectsPath = path.join(fixturesBasePath, "projects");

test.serial("ui5lint API: Simultaneously test different projects", async (t) => {
	const appPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const libPath = path.join(fixturesProjectsPath, "library.with.custom.paths");

	const results = await Promise.all([
		ui5lint({rootDir: appPath}),
		ui5lint({rootDir: libPath}),
	]);

	results.forEach((res) => {
		t.snapshot(preprocessLintResultsForSnapshot(res.results));
	});
});
