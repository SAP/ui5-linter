import anyTest, {TestFn} from "ava";
import sinon, {SinonStub} from "sinon";
import yargs, {Argv} from "yargs";
import path from "node:path";
import cliBase from "../../../src/cli/base.js";
import {fileURLToPath} from "node:url";
import {LintResult} from "../../../src/linter/LinterContext.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleProjectPath = path.join(__dirname, "..", "..", "fixtures", "linter", "projects", "com.ui5.troublesome.app");

const test = anyTest as TestFn<{
	consoleLogStub: SinonStub;
	processCwdStub: SinonStub;
	processStdoutWriteStub: SinonStub;
	processExitStub: SinonStub;
	cli: Argv;
}>;

test.beforeEach((t) => {
	t.context.consoleLogStub = sinon.stub(console, "log");
	t.context.processCwdStub = sinon.stub(process, "cwd").returns(sampleProjectPath);
	t.context.processStdoutWriteStub = sinon.stub(process.stdout, "write").returns(true);
	t.context.processExitStub = sinon.stub(process, "exit");
	t.context.cli = yargs();
	cliBase(t.context.cli);
});

test.afterEach.always(() => {
	sinon.restore();
});

// Test if standard output is parsable JSON
test.serial("ui5lint --format json", async (t) => {
	const {cli, consoleLogStub, processCwdStub, processStdoutWriteStub, processExitStub} = t.context;

	await cli.parseAsync(["--format", "json"]);

	t.is(consoleLogStub.callCount, 0, "console.log should not be used");
	t.true(processCwdStub.callCount > 0, "process.cwd was called");
	t.is(processStdoutWriteStub.callCount, 2, "process.stdout.write was called twice");
	t.is(processExitStub.callCount, 0, "process.exit got never called");
	t.is(process.exitCode, 1, "process.exitCode was set to 1");
	// cleanup: reset exit code in order not to fail the test (it cannot be stubbed with sinon)
	process.exitCode = 0;

	const resultProcessStdoutJSON = processStdoutWriteStub.firstCall.firstArg;
	let parsedJson: LintResult[];

	t.notThrows(() => parsedJson = JSON.parse(resultProcessStdoutJSON),
		"Output of process.stdout.write is JSON-formatted");
	t.true(Array.isArray(parsedJson!), "The parsed JSON output is a LintResult array");
	t.true(parsedJson!.length > 0, "The parsed JSON output contains at least one result");

	const resultProcessStdoutNL = processStdoutWriteStub.secondCall.firstArg;
	t.is(resultProcessStdoutNL, "\n", "second write only adds a single newline");
});

// New test for Markdown format
test.serial("ui5lint --format markdown", async (t) => {
	const {cli, consoleLogStub, processCwdStub, processStdoutWriteStub, processExitStub} = t.context;

	await cli.parseAsync(["--format", "markdown"]);

	t.is(consoleLogStub.callCount, 0, "console.log should not be used");
	t.true(processCwdStub.callCount > 0, "process.cwd was called");
	t.is(processStdoutWriteStub.callCount, 2, "process.stdout.write was called twice");
	t.is(processExitStub.callCount, 0, "process.exit got never called");
	t.is(process.exitCode, 1, "process.exitCode was set to 1");
	// cleanup: reset exit code in order not to fail the test (it cannot be stubbed with sinon)
	process.exitCode = 0;

	const resultProcessStdoutMarkdown = processStdoutWriteStub.firstCall.firstArg;
	t.true(resultProcessStdoutMarkdown.startsWith("# UI5 linter Report"),
		"Output starts with the expected Markdown header");

	const resultProcessStdoutNL = processStdoutWriteStub.secondCall.firstArg;
	t.is(resultProcessStdoutNL, "\n", "second write only adds a single newline");
});
