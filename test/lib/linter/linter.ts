import anyTest, {TestFn} from "ava";
import sinonGlobal, {SinonStub} from "sinon";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
	createTestsForFixtures, assertExpectedLintResults,
	esmockDeprecationText, preprocessLintResultsForSnapshot,
} from "./_linterHelper.js";
import {LintResult} from "../../../src/detectors/AbstractDetector.js";
import {LinterOptions} from "../../../src/linter/linter.js";

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
		filePaths: [],
		reportCoverage: true,
		messageDetails: true,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: Some files of com.ui5.troublesome.app (without details / coverage)", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "com.ui5.troublesome.app");
	const filePaths = [
		path.join("webapp", "controller", "BaseController.js"),
		path.join("webapp", "controller", "App.controller.js"),
		path.join("webapp", "Component.js"),
	];
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePaths,
	});

	assertExpectedLintResults(t, res, projectPath, [
		path.join("webapp", "model", "models.js"),
		...filePaths,
	]);

	t.snapshot(preprocessLintResultsForSnapshot(res));
});

test.serial("lint: All files of library.with.custom.paths", async (t) => {
	const projectPath = path.join(fixturesProjectsPath, "library.with.custom.paths");
	const {lintProject} = t.context;

	const res = await lintProject({
		rootDir: projectPath,
		filePaths: [],
		reportCoverage: true,
		messageDetails: true,
	});

	t.snapshot(preprocessLintResultsForSnapshot(res));
});
