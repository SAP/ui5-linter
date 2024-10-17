import anyTest, {TestFn} from "ava";
import sinonGlobal, {SinonStub} from "sinon";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
	createTestsForFixtures, assertExpectedLintResults,
	esmockDeprecationText, preprocessLintResultsForSnapshot,
} from "./_linterHelper.js";
import {LinterOptions, LintResult} from "../../../src/linter/LinterContext.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesBasePath = path.join(__dirname, "..", "..", "fixtures", "linter");
const fixturesGeneralPath = path.join(fixturesBasePath, "general");
const fixturesProjectsPath = path.join(fixturesBasePath, "projects");

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
	lintProject: SinonStub<[LinterOptions], Promise<LintResult[]>>;
}>;

test.before(async (t) => {
	t.context.sinon = sinonGlobal.createSandbox();

	const {lintModule: {lintProject}} = await esmockDeprecationText();
	t.context.lintProject = lintProject;
});
test.after.always((t) => {
	t.context.sinon.restore();
});

// Define tests for reach file in the fixtures/linter/general directory
createTestsForFixtures(fixturesGeneralPath);

// Test project fixtures individually
test.serial("lint: All files of com.ui5.troublesome.app", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: [],
		reportCoverage: true,
		includeMessageDetails: true,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: Some files of com.ui5.troublesome.app (without details / coverage)", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const filePaths = [
		// Minimatch requires POSIX
		path.posix.join("webapp", "controller", "BaseController.js"),
		path.posix.join("webapp", "controller", "App.controller.js"),
		path.posix.join("webapp", "Component.js"),
	];
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: filePaths,
	});

	assertExpectedLintResults(t, res, projectPath, [
		path.join("webapp", "model", "models.js"),
		// Comparing files requires platform specific separators,
		// so, translating POSIX to platform specific.
		...filePaths.map((filename) => filename.replaceAll("/", path.sep)),
	]);

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: Only /webapp folder from com.ui5.troublesome.app (without details / coverage)", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const filePaths = [
		// Minimatch requires POSIX
		"webapp/",
	];
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: filePaths,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: One file of com.ui5.troublesome.app (without details / coverage)", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const filePaths = [
		// Minimatch requires POSIX
		path.posix.join("webapp", "controller", "App.controller.js"),
	];
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: filePaths,
	});

	assertExpectedLintResults(t, res, projectPath, [
		// Comparing files requires platform specific separators,
		// so, translating POSIX to platform specific.
		...filePaths.map((filename) => filename.replaceAll("/", path.sep)),
	]);

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: com.ui5.troublesome.app with unmatched patterns", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");

	const {lintProject} = t.context;

	await t.throwsAsync(lintProject({
		rootDir: projectPath,
		configPath: "ui5lint.config.unmatched-patterns.mjs",
	}), {
		message: `Specified file patterns 'unmatched-pattern1', ` +
			`'unmatched-pattern2', 'unmatched-pattern3' did not match any resource`,
	});
});

test.serial("lint: com.ui5.troublesome.app with files property in ui5lint.config", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");

	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		configPath: "ui5lint.config.matched-patterns.mjs",
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: All files of library.with.custom.paths", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "library.with.custom.paths");
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: [],
		reportCoverage: true,
		includeMessageDetails: true,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: Ignore files from library.with.custom.paths", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "library.with.custom.paths");
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: [],
		reportCoverage: true,
		includeMessageDetails: true,
		ignorePattern: [
			"src/",
			"!src/main/",
		],
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: All files of library with sap.f namespace", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "sap.f");
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: [],
		reportCoverage: true,
		includeMessageDetails: true,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: All files of mocked minimal sap.ui.core library", async (t) => {
	// This sap.ui.core library contains a minimal version of the base classes of UI5
	// so that the linter can be tested with having them available in the project instead
	// of just having the type definitions.

	const projectPath = path.join(fixturesProjectsPath, "sap.ui.core");
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: [],
		reportCoverage: true,
		includeMessageDetails: true,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: All files of library with sap.ui.suite namespace", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "sap.ui.suite");
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: [],
		reportCoverage: true,
		includeMessageDetails: true,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: All files of com.ui5.troublesome.app with custom config", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: [],
		reportCoverage: true,
		includeMessageDetails: true,
		configPath: "./ui5lint-custom.config.cjs",
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: com.ui5.troublesome.app with custom UI5 config", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePatterns: [],
		reportCoverage: true,
		includeMessageDetails: true,
		ui5ConfigPath: "./configs/ui5-custom.yaml",
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: com.ui5.troublesome.app with custom UI5 config which does NOT exist", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const {lintProject} = t.context;
	const ui5ConfigPath = "./configs/ui5-DOES-NOT-EXIST.yaml";

	await t.throwsAsync(lintProject({
		rootDir: projectPath,
		filePatterns: [],
		reportCoverage: true,
		includeMessageDetails: true,
		ui5ConfigPath,
	}), {message: `Unable to find UI5 config file '${ui5ConfigPath}'`});
});
