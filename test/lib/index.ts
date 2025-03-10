import anyTest, {TestFn} from "ava";
import sinonGlobal, {SinonStub} from "sinon";
import esmock from "esmock";
import {ui5lint, UI5LinterEngine} from "../../src/index.js";
import {lintProject} from "../../src/linter/linter.js";
import SharedLanguageService from "../../src/linter/ui5Types/SharedLanguageService.js";

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
	lintProjectStub: SinonStub<Parameters<typeof lintProject>, ReturnType<typeof lintProject>>;
	ui5lint: typeof ui5lint;
	UI5LinterEngine: typeof UI5LinterEngine;
}>;

test.beforeEach(async (t) => {
	t.context.sinon = sinonGlobal.createSandbox();

	t.context.lintProjectStub =
		t.context.sinon.stub<Parameters<typeof lintProject>, ReturnType<typeof lintProject>>().resolves({results: []});

	const {ui5lint, UI5LinterEngine} = await esmock("../../src/index.js", {
		"../../src/linter/linter.js": {
			lintProject: t.context.lintProjectStub,
		},
	});

	t.context.ui5lint = ui5lint;
	t.context.UI5LinterEngine = UI5LinterEngine;
});
test.afterEach.always((t) => {
	t.context.sinon.restore();
});

test("ui5lint API: No arguments", async (t) => {
	const {ui5lint} = t.context;

	const res = await ui5lint();

	t.deepEqual(res.results, []);

	t.is(t.context.lintProjectStub.callCount, 1);
	t.is(t.context.lintProjectStub.getCall(0).args.length, 2);
	t.deepEqual(t.context.lintProjectStub.getCall(0).args[0], {
		configPath: undefined,
		coverage: false,
		details: false,
		filePatterns: undefined,
		fix: false,
		ignorePatterns: [],
		noConfig: undefined,
		rootDir: process.cwd(),
		ui5Config: undefined,
	});
	t.true(t.context.lintProjectStub.getCall(0).args[1] instanceof SharedLanguageService);
});

test("ui5lint API: Empty options", async (t) => {
	const {ui5lint} = t.context;

	const res = await ui5lint({});

	t.deepEqual(res.results, []);

	t.is(t.context.lintProjectStub.callCount, 1);
	t.is(t.context.lintProjectStub.getCall(0).args.length, 2);
	t.deepEqual(t.context.lintProjectStub.getCall(0).args[0], {
		configPath: undefined,
		coverage: false,
		details: false,
		filePatterns: undefined,
		fix: false,
		ignorePatterns: [],
		noConfig: undefined,
		rootDir: process.cwd(),
		ui5Config: undefined,
	});
	t.true(t.context.lintProjectStub.getCall(0).args[1] instanceof SharedLanguageService);
});

test("ui5lint API: All options", async (t) => {
	const {ui5lint} = t.context;

	const res = await ui5lint({
		filePatterns: ["webapp/**/*.xml"],
		ignorePatterns: ["webapp/thirdparty/"],
		details: true,
		config: "ui5lint-foo.config.mjs",
		noConfig: true,
		coverage: true,
		ui5Config: "ui5-lint.yaml",
		rootDir: "/path/to/project",
	});

	t.deepEqual(res.results, []);

	t.is(t.context.lintProjectStub.callCount, 1);
	t.is(t.context.lintProjectStub.getCall(0).args.length, 2);
	t.deepEqual(t.context.lintProjectStub.getCall(0).args[0], {
		configPath: "ui5lint-foo.config.mjs",
		coverage: true,
		details: true,
		filePatterns: ["webapp/**/*.xml"],
		fix: false,
		ignorePatterns: ["webapp/thirdparty/"],
		noConfig: true,
		rootDir: "/path/to/project",
		ui5Config: "ui5-lint.yaml",
	});
	t.true(t.context.lintProjectStub.getCall(0).args[1] instanceof SharedLanguageService);
});

test("UI5LinterEngine: Creating an instance", (t) => {
	const engine = new UI5LinterEngine();
	t.true(engine instanceof UI5LinterEngine);
});

test("UI5LinterEngine: Calling 'lint'", async (t) => {
	const {UI5LinterEngine} = t.context;

	const engine = new UI5LinterEngine();

	const results = await engine.lint({});

	t.deepEqual(results.results, []);

	t.is(t.context.lintProjectStub.callCount, 1);
	t.is(t.context.lintProjectStub.getCall(0).args.length, 2);
	t.deepEqual(t.context.lintProjectStub.getCall(0).args[0], {
		configPath: undefined,
		coverage: false,
		details: false,
		filePatterns: undefined,
		fix: false,
		ignorePatterns: [],
		noConfig: undefined,
		rootDir: process.cwd(),
		ui5Config: undefined,
	});
	const sharedLanguageService = t.context.lintProjectStub.getCall(0).args[1];
	t.true(sharedLanguageService instanceof SharedLanguageService);

	// @ts-expect-error access of private property for testing purposes
	t.is(sharedLanguageService, engine.sharedLanguageService);
});

test("UI5LinterEngine: Calling 'lint' twice before first run is finished", async (t) => {
	const {UI5LinterEngine} = t.context;

	const engine = new UI5LinterEngine();

	const firstLintRun = engine.lint({});
	const secondLintRun = engine.lint({});

	await t.throwsAsync(secondLintRun, {
		message: "Linting is already in progress",
	});

	const results = await firstLintRun;
	t.deepEqual(results.results, []);
});

test("UI5LinterEngine: Calling 'lint' multiple times", async (t) => {
	const {UI5LinterEngine} = t.context;

	const engine = new UI5LinterEngine();

	const firstLintResults = await engine.lint({
		filePatterns: ["webapp/**/*.xml"],
		ignorePatterns: ["webapp/thirdparty/"],
		details: true,
		config: "ui5lint-foo.config.mjs",
		noConfig: true,
		coverage: true,
		ui5Config: "ui5-lint.yaml",
		rootDir: "/path/to/project",
	});

	t.deepEqual(firstLintResults.results, []);

	t.is(t.context.lintProjectStub.callCount, 1);
	t.is(t.context.lintProjectStub.getCall(0).args.length, 2);
	t.deepEqual(t.context.lintProjectStub.getCall(0).args[0], {
		configPath: "ui5lint-foo.config.mjs",
		coverage: true,
		details: true,
		filePatterns: ["webapp/**/*.xml"],
		fix: false,
		ignorePatterns: ["webapp/thirdparty/"],
		noConfig: true,
		rootDir: "/path/to/project",
		ui5Config: "ui5-lint.yaml",
	});
	const firstLintSharedLanguageService = t.context.lintProjectStub.getCall(0).args[1];
	t.true(firstLintSharedLanguageService instanceof SharedLanguageService);
	// @ts-expect-error access of private property for testing purposes
	t.is(firstLintSharedLanguageService, engine.sharedLanguageService);

	const secondLintResults = await engine.lint();

	t.deepEqual(secondLintResults.results, []);

	t.is(t.context.lintProjectStub.callCount, 2);
	t.is(t.context.lintProjectStub.getCall(1).args.length, 2);
	t.deepEqual(t.context.lintProjectStub.getCall(1).args[0], {
		configPath: undefined,
		coverage: false,
		details: false,
		filePatterns: undefined,
		fix: false,
		ignorePatterns: [],
		noConfig: undefined,
		rootDir: process.cwd(),
		ui5Config: undefined,
	});
	const secondLintSharedLanguageService = t.context.lintProjectStub.getCall(0).args[1];
	t.true(secondLintSharedLanguageService instanceof SharedLanguageService);
	// @ts-expect-error access of private property for testing purposes
	t.is(secondLintSharedLanguageService, engine.sharedLanguageService);

	// The shared language service should be the same for both runs
	t.is(firstLintSharedLanguageService, secondLintSharedLanguageService);
});

test("UI5LinterEngine: Calling 'lint' again after it failed", async (t) => {
	const {UI5LinterEngine} = t.context;

	const engine = new UI5LinterEngine();

	t.context.lintProjectStub.onFirstCall().rejects(new Error("Something went wrong"));

	await t.throwsAsync(engine.lint(), {
		message: "Something went wrong",
	});

	const firstLintSharedLanguageService = t.context.lintProjectStub.getCall(0).args[1];
	t.true(firstLintSharedLanguageService instanceof SharedLanguageService);
	// @ts-expect-error access of private property for testing purposes
	t.is(firstLintSharedLanguageService, engine.sharedLanguageService);

	const secondLintResults = await engine.lint();

	t.deepEqual(secondLintResults.results, []);

	t.is(t.context.lintProjectStub.callCount, 2);
	t.is(t.context.lintProjectStub.getCall(1).args.length, 2);
	t.deepEqual(t.context.lintProjectStub.getCall(1).args[0], {
		configPath: undefined,
		coverage: false,
		details: false,
		filePatterns: undefined,
		fix: false,
		ignorePatterns: [],
		noConfig: undefined,
		rootDir: process.cwd(),
		ui5Config: undefined,
	});
	const secondLintSharedLanguageService = t.context.lintProjectStub.getCall(0).args[1];
	t.true(secondLintSharedLanguageService instanceof SharedLanguageService);
	// @ts-expect-error access of private property for testing purposes
	t.is(secondLintSharedLanguageService, engine.sharedLanguageService);

	// The shared language service should be the same for both runs
	t.is(firstLintSharedLanguageService, secondLintSharedLanguageService);
});
