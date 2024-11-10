import anyTest, {TestFn} from "ava";
import sinonGlobal, {SinonStub} from "sinon";
import esmock from "esmock";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
	esmockDeprecationText, preprocessLintResultsForSnapshot,
} from "./linter/_linterHelper.js";
import {LintResult} from "../../src/linter/LinterContext.js";
import {UI5LinterOptions} from "../../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesBasePath = path.join(__dirname, "..", "fixtures", "linter");
const fixturesProjectsPath = path.join(fixturesBasePath, "projects");

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
	ui5lint: SinonStub<[UI5LinterOptions], Promise<LintResult[]>>;
}>;

test.before(async (t) => {
	t.context.sinon = sinonGlobal.createSandbox();

	const {ui5lint} = await esmock("../../src/index.js", {
		"../../src/linter/linter.js": await esmockDeprecationText(),
	});

	t.context.ui5lint = ui5lint;
});
test.after.always((t) => {
	t.context.sinon.restore();
});

// Test project fixtures individually
test.serial("ui5lint API: Provide config as an object for com.ui5.troublesome.app", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const {ui5lint} = t.context;

	const res = await ui5lint({
		rootDir: projectPath,
		ui5Config: {
			specVersion: "3.0",
			metadata: {
				name: "com.ui5.troublesome.app",
			},
			type: "application",
			framework: {
				name: "OpenUI5",
				version: "1.121.0",
				libraries: [
					{name: "sap.m"},
					{name: "sap.ui.core"},
					{name: "sap.landvisz"},
				],
			},
		},
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("ui5lint API: Only /webapp folder from com.ui5.troublesome.app", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const filePaths = [
		// Minimatch requires POSIX
		"webapp/",
	];
	const {ui5lint} = t.context;

	const res = await ui5lint({
		rootDir: projectPath,
		filePatterns: filePaths,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("ui5lint API: com.ui5.troublesome.app with unmatched patterns", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");

	const {ui5lint} = t.context;

	await t.throwsAsync(ui5lint({
		rootDir: projectPath,
		config: "ui5lint.config.unmatched-patterns.mjs",
	}), {
		message: `Specified file patterns 'unmatched-pattern1', ` +
			`'unmatched-pattern2', 'unmatched-pattern3' did not match any resource`,
	});
});

test.serial("ui5lint API: Ignore webapp/controller folder from com.ui5.troublesome.app (with details & coverage)",
	async (t) => {
		const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
		const ignorePatterns = [
			// Minimatch requires POSIX
			"webapp/controller/",
		];
		const {ui5lint} = t.context;

		const res = await ui5lint({
			rootDir: projectPath,
			ignorePatterns,
			coverage: true,
			details: true,
		});

		t.snapshot(preprocessLintResultsForSnapshot(res));
	});

test.serial("ui5lint API: Ignore config file for com.ui5.troublesome.app", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const {ui5lint} = t.context;

	const res = await ui5lint({
		rootDir: projectPath,
		noConfig: true,
		config: "ui5lint.config.unmatched-patterns.mjs",
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("ui5lint API: Use defaults", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const {ui5lint, sinon} = t.context;
	// Stub process.cwd(), so we have some app to test
	sinon.stub(process, "cwd").returns(projectPath);

	const res = await ui5lint({});

	t.snapshot(preprocessLintResultsForSnapshot(res));
	sinon.restore();
});

test.serial("ui5lint API: Simultaneously test different projects", async (t) => {
	const appPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const libPath = path.join(fixturesProjectsPath, "library.with.custom.paths");
	const {ui5lint} = t.context;

	const results = await Promise.all([
		ui5lint({rootDir: appPath}),
		ui5lint({rootDir: libPath}),
	]);

	results.forEach((res) => {
		t.snapshot(preprocessLintResultsForSnapshot(res));
	});
});
