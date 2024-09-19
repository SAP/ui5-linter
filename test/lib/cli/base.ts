/* eslint-disable @typescript-eslint/require-await */
import anyTest, {TestFn} from "ava";
import sinon, {SinonStub} from "sinon";
import esmock from "esmock";
import chalk from "chalk";
import yargs, {Argv} from "yargs";
import path from "node:path";
import type {LintResult} from "../../../src/linter/LinterContext.js";
import type Base from "../../../src/cli/base.js";

const test = anyTest as TestFn<{
	lintProject: SinonStub;
	writeFile: SinonStub;
	consoleLogStub: SinonStub;
	processStdErrWriteStub: SinonStub;
	isLogLevelEnabledStub: SinonStub;
	consoleWriterStopStub: SinonStub;
	processErrWrite: SinonStub;
	formatText: SinonStub;
	formatJson: SinonStub;
	formatMarkdown: SinonStub;
	createExitStub: () => SinonStub;
	cli: Argv;
	base: typeof Base;
}>;

test.beforeEach(async (t) => {
	const lintResult: LintResult = {
		filePath: "",
		messages: [],
		coverageInfo: [],
		errorCount: 0,
		fatalErrorCount: 0,
		warningCount: 0,
	};

	t.context.consoleLogStub = sinon.stub(console, "log");
	t.context.processStdErrWriteStub = sinon.stub(process.stderr, "write").returns(true);

	t.context.isLogLevelEnabledStub = sinon.stub();
	t.context.isLogLevelEnabledStub.withArgs("error").returns(true);
	t.context.isLogLevelEnabledStub.withArgs("verbose").returns(false);
	t.context.consoleWriterStopStub = sinon.stub();

	t.context.lintProject = sinon.stub().resolves([lintResult]);
	t.context.writeFile = sinon.stub().resolves();
	t.context.cli = yargs();

	t.context.formatText = sinon.stub().returns("");
	t.context.formatJson = sinon.stub().returns("");
	t.context.formatMarkdown = sinon.stub().returns("");

	t.context.base = await esmock.p("../../../src/cli/base.js", {
		"../../../src/linter/linter.js": {
			lintProject: t.context.lintProject,
		},
		"../../../src/formatter/coverage.js": {
			Coverage: sinon.stub().callsFake(() => {
				return {format: sinon.stub().returns(null)};
			}),
		},
		"../../../src/formatter/text.js": {
			Text: sinon.stub().callsFake(() => {
				return {format: t.context.formatText};
			}),
		},
		"../../../src/formatter/json.js": {
			Json: sinon.stub().callsFake(() => {
				return {format: t.context.formatJson};
			}),
		},
		"../../../src/formatter/markdown.js": {
			Markdown: sinon.stub().callsFake(() => {
				return {format: t.context.formatMarkdown};
			}),
		},
		"node:fs/promises": {
			writeFile: t.context.writeFile,
		},
		"@ui5/logger": {
			isLogLevelEnabled: t.context.isLogLevelEnabledStub,
		},
		"@ui5/logger/writers/Console": {
			stop: t.context.consoleWriterStopStub,
		},
	});

	t.context.base(t.context.cli);

	t.context.createExitStub = () => {
		return sinon.stub(process, "exit");
	};
});

test.afterEach.always((t) => {
	esmock.purge(t.context.base);
	sinon.restore();
});

test.serial("ui5lint (default) ", async (t) => {
	const {cli, lintProject, writeFile} = t.context;

	await cli.parseAsync([]);

	t.true(lintProject.calledOnce, "Linter is called");
	t.is(writeFile.callCount, 0, "Coverage was not called");
	t.deepEqual(lintProject.getCall(0).args[0], {
		rootDir: path.join(process.cwd()), pathsToLint: undefined, ignorePattern: undefined, configPath: undefined,
		includeMessageDetails: false, reportCoverage: false, ui5ConfigPath: undefined,
	});
	t.is(t.context.consoleLogStub.callCount, 0, "console.log should not be used");
});

test.serial("ui5lint --file-paths ", async (t) => {
	const {cli, lintProject} = t.context;
	const filePaths = [
		path.resolve(process.cwd(), "path/to/resource"),
		path.resolve(process.cwd(), "another/path/to/resource"),
	];

	await cli.parseAsync(["--file-paths", filePaths[0], "--file-paths", filePaths[1]]);

	t.true(lintProject.calledOnce, "Linter is called");
	t.deepEqual(lintProject.getCall(0).args[0], {
		rootDir: path.join(process.cwd()), pathsToLint: filePaths, ignorePattern: undefined, configPath: undefined,
		includeMessageDetails: false, reportCoverage: false, ui5ConfigPath: undefined,
	});
	t.is(t.context.consoleLogStub.callCount, 0, "console.log should not be used");
});

test.serial("ui5lint --coverage ", async (t) => {
	const {cli, lintProject, writeFile} = t.context;

	await cli.parseAsync(["--coverage"]);

	t.true(lintProject.calledOnce, "Linter is called");
	t.is(writeFile.callCount, 1, "Coverage was called");
	t.deepEqual(lintProject.getCall(0).args[0], {
		rootDir: path.join(process.cwd()), pathsToLint: undefined, ignorePattern: undefined, configPath: undefined,
		includeMessageDetails: false, reportCoverage: true, ui5ConfigPath: undefined,
	});
	t.is(t.context.consoleLogStub.callCount, 0, "console.log should not be used");
});

test.serial("ui5lint --details ", async (t) => {
	const {cli, lintProject, formatText} = t.context;

	await cli.parseAsync(["--details"]);

	t.true(lintProject.calledOnce, "Linter is called");
	t.true(formatText.getCall(0).args[1], "linter is called with 'details=true' flag");
	t.is(t.context.consoleLogStub.callCount, 0, "console.log should not be used");
});

test.serial("ui5lint --format json ", async (t) => {
	const {cli, lintProject, formatJson} = t.context;

	await cli.parseAsync(["--format", "json"]);

	t.true(lintProject.calledOnce, "Linter is called");
	t.true(formatJson.calledOnce, "JSON formatter has been called");
});

test.serial("ui5lint --ignore-pattern ", async (t) => {
	const {cli, lintProject} = t.context;

	await cli.parseAsync(["--ignore-pattern", "test/**/*"]);

	t.true(lintProject.calledOnce, "Linter is called");
	t.deepEqual(lintProject.getCall(0).args[0], {
		rootDir: path.join(process.cwd()), pathsToLint: undefined, ignorePattern: ["test/**/*"], configPath: undefined,
		includeMessageDetails: false, reportCoverage: false, ui5ConfigPath: undefined,
	});
});

test.serial("ui5lint --format markdown", async (t) => {
	const {cli, lintProject, formatMarkdown} = t.context;

	await cli.parseAsync(["--format", "markdown"]);

	t.true(lintProject.calledOnce, "Linter is called");
	t.true(formatMarkdown.calledOnce, "Markdown formatter has been called");
});

test.serial("ui5lint --config", async (t) => {
	const {cli, lintProject} = t.context;

	await cli.parseAsync(["--config", "config.js"]);

	t.true(lintProject.calledOnce, "Linter is called");
	t.deepEqual(lintProject.getCall(0).args[0], {
		rootDir: path.join(process.cwd()), pathsToLint: undefined, ignorePattern: undefined, configPath: "config.js",
		includeMessageDetails: false, reportCoverage: false, ui5ConfigPath: undefined,
	});
});

test.serial("Yargs error handling", async (t) => {
	const {processStdErrWriteStub, consoleWriterStopStub, cli, createExitStub} = t.context;
	const processExitStub = createExitStub();
	cli.command({
		command: "foo",
		describe: "This is a task",
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		handler: async function () {},
	});

	await cli.parseAsync(["invalid"]);

	t.is(processExitStub.firstCall.firstArg, 2, "Should exit with error code 2");
	t.is(consoleWriterStopStub.callCount, 0, "ConsoleWriter.stop did not get called");
	t.is(processStdErrWriteStub.callCount, 5);
	t.deepEqual(processStdErrWriteStub.getCall(0).args, [
		chalk.bold.yellow("Command Failed:") + "\n",
	], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(1).args, ["Unknown argument: invalid\n"], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(2).args, ["\n"], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(3).args, [
		chalk.dim(`See 'ui5lint --help'`) + "\n",
	], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(4).args, [""],
		"Note: This is a call from handleLint as yargs doesn't really stop when process.exit is stubbed. " +
		"The command handler is still executed in this case.");
	t.is(t.context.consoleLogStub.callCount, 0, "console.log should not be used");
});

test.serial("Exception error handling", async (t) => {
	const {cli, processStdErrWriteStub, consoleWriterStopStub, createExitStub} = t.context;
	const processExitStub = createExitStub();
	const error = new Error("Some error from foo command");

	cli.command({
		command: "foo",
		describe: "This task fails with an error",
		handler: async function () {
			throw error;
		},
	});

	await t.throwsAsync(cli.parseAsync(["foo"]), {
		is: error,
	});

	t.is(processExitStub.firstCall.firstArg, 2, "Should exit with error code 2");
	t.is(consoleWriterStopStub.callCount, 1, "ConsoleWriter.stop got called once");
	t.is(processStdErrWriteStub.callCount, 7);
	t.deepEqual(processStdErrWriteStub.getCall(1).args, [
		chalk.bold.red("⚠️  Process Failed With Error") + "\n",
	], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(3).args, [
		chalk.underline("Error Message:") + "\n",
	], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(4).args,
		["Some error from foo command\n"], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(6).args, [chalk.dim(
		`For details, execute the same command again with an additional '--verbose' parameter`) +
		"\n",
	], "Correct error log");
	t.is(t.context.consoleLogStub.callCount, 0, "console.log should not be used");
});

test.serial("Exception error handling without logging (silent)", async (t) => {
	const {cli, processStdErrWriteStub, isLogLevelEnabledStub, consoleWriterStopStub, createExitStub} = t.context;
	const processExitStub = createExitStub();
	isLogLevelEnabledStub.withArgs("error").returns(false);

	const error = new Error("Some error from foo command");

	cli.command({
		command: "foo",
		describe: "This task fails with an error",
		handler: async function () {
			throw error;
		},
	});

	await t.throwsAsync(cli.parseAsync(["foo"]), {
		is: error,
	});

	t.is(processExitStub.firstCall.firstArg, 2, "Should exit with error code 2");
	t.is(consoleWriterStopStub.callCount, 1, "ConsoleWriter.stop got called once");
	t.is(processStdErrWriteStub.callCount, 0);
	t.is(t.context.consoleLogStub.callCount, 0, "console.log should not be used");
});

test.serial("Exception error handling with verbose logging", async (t) => {
	const {cli, processStdErrWriteStub, isLogLevelEnabledStub, createExitStub} = t.context;
	const processExitStub = createExitStub();
	isLogLevelEnabledStub.withArgs("verbose").returns(true);

	const error = new Error("Some error from foo command");

	cli.command({
		command: "foo",
		describe: "This task fails with an error",
		handler: async function () {
			throw error;
		},
	});

	await t.throwsAsync(cli.parseAsync(["foo"]), {
		is: error,
	});

	t.is(processExitStub.firstCall.firstArg, 2, "Should exit with error code 2");
	t.is(processStdErrWriteStub.callCount, 10);
	t.deepEqual(processStdErrWriteStub.getCall(1).args, [
		chalk.bold.red("⚠️  Process Failed With Error") + "\n",
	], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(3).args, [
		chalk.underline("Error Message:") + "\n",
	], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(4).args,
		["Some error from foo command\n"], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(6).args, [chalk.underline("Stack Trace:") + "\n"], "Correct error log");
	t.is(processStdErrWriteStub.getCall(7).args.length, 1);
	t.true(processStdErrWriteStub.getCall(7).args[0]
		.startsWith("Error: Some error from foo command"), "Correct error log");

	t.deepEqual(processStdErrWriteStub.getCall(processStdErrWriteStub.callCount - 1).args,
		[chalk.dim(
			`If you think this is an issue of the ui5-linter, you might report it using the ` +
			`following URL: `) +
			chalk.dim.bold.underline(`https://github.com/SAP/ui5-linter/issues/new/choose`) + "\n"],
		"Correct last log line");
	t.is(t.context.consoleLogStub.callCount, 0, "console.log should not be used");
});

test.serial("Unexpected error handling", async (t) => {
	const {processStdErrWriteStub, consoleWriterStopStub, cli, createExitStub} = t.context;
	const processExitStub = createExitStub();
	const typeError = new TypeError("Cannot do this");

	cli.command({
		command: "foo",
		describe: "This task fails with a TypeError",
		handler: async function () {
			throw typeError;
		},
	});

	await t.throwsAsync(cli.parseAsync(["foo"]), {
		is: typeError,
	});

	t.is(processExitStub.firstCall.firstArg, 2, "Should exit with error code 2");
	t.is(consoleWriterStopStub.callCount, 1, "ConsoleWriter.stop got called once");
	t.is(processStdErrWriteStub.callCount, 10);
	t.deepEqual(processStdErrWriteStub.getCall(1).args, [
		chalk.bold.red("⚠️  Process Failed With Error") + "\n",
	], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(3).args, [
		chalk.underline("Error Message:") + "\n",
	], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(4).args,
		["Cannot do this\n"], "Correct error log");
	t.deepEqual(processStdErrWriteStub.getCall(6).args, [chalk.underline("Stack Trace:") + "\n"], "Correct error log");
	t.is(processStdErrWriteStub.getCall(7).args.length, 1);
	t.true(processStdErrWriteStub.getCall(7).args[0]
		.startsWith("TypeError: Cannot do this"), "Correct error log");

	t.deepEqual(processStdErrWriteStub.getCall(processStdErrWriteStub.callCount - 1).args,
		[chalk.dim(
			`If you think this is an issue of the ui5-linter, you might report it using the ` +
			`following URL: `) +
			chalk.dim.bold.underline(`https://github.com/SAP/ui5-linter/issues/new/choose`) + "\n"],
		"Correct last log line");
	t.is(t.context.consoleLogStub.callCount, 0, "console.log should not be used");
});
