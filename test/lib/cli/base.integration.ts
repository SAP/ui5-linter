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

	// Instead of testing actual process.exitCode
	const before = process.exitCode;
	await cli.parseAsync(["--format", "json"]);
	t.not(before, process.exitCode, "Exit code was changed");
	process.exitCode = 0; // Reset immediately

	t.is(consoleLogStub.callCount, 0, "console.log should not be used");
	t.true(processCwdStub.callCount > 0, "process.cwd was called");
	t.is(processStdoutWriteStub.callCount, 2, "process.stdout.write was called twice");
	t.is(processExitStub.callCount, 0, "process.exit got never called");

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

	// Reset immediately
	process.exitCode = 0;

	const resultProcessStdoutMarkdown = processStdoutWriteStub.firstCall.firstArg;
	t.true(resultProcessStdoutMarkdown.length > 0, "Output is not empty");
	t.true(resultProcessStdoutMarkdown.startsWith("# UI5 Linter Report"),
		"Output starts with the expected Markdown header");

	const resultProcessStdoutNL = processStdoutWriteStub.secondCall.firstArg;
	t.is(resultProcessStdoutNL, "\n", "second write only adds a single newline");
});

// Test for --quiet option with default formatter
test.serial("ui5lint --quiet", async (t) => {
	const {cli, consoleLogStub, processCwdStub, processExitStub} = t.context;

	// We need to manually create a stderr stub since it's not in the context
	const stderrWriteStub = sinon.stub(process.stderr, "write").returns(true);

	try {
		// First run without quiet
		await cli.parseAsync([]);
		const normalOutput = stderrWriteStub.firstCall.firstArg;
		t.true(normalOutput.length > 0, "Normal output is not empty");

		// Reset the stub's history before the second run
		stderrWriteStub.resetHistory();

		// Then run with quiet
		await cli.parseAsync(["--quiet"]);
		const quietOutput = stderrWriteStub.firstCall.firstArg;
		t.true(quietOutput.length > 0, "Quiet output is not empty");

		t.is(consoleLogStub.callCount, 0, "console.log should not be used");
		t.true(processCwdStub.callCount > 0, "process.cwd was called");
		t.is(processExitStub.callCount, 0, "process.exit got never called");

		// Reset immediately
		process.exitCode = 0;

		// Check that quiet output is different from normal output
		t.notDeepEqual(quietOutput, normalOutput, "Quiet output differs from normal output");

		// Quiet output should not contain the word "warnings" in the summary
		t.false(quietOutput.includes(" warnings)"), "Quiet output should not mention warnings count");
	} finally {
		// Always restore the stub
		stderrWriteStub.restore();
		// Ensure process.exitCode is reset
		process.exitCode = 0;
	}
});

// Test for --quiet option with JSON format
test.serial("ui5lint --quiet --format json", async (t) => {
	const {cli, processExitStub, processStdoutWriteStub} = t.context;

	// Reset the stub's history
	processStdoutWriteStub.resetHistory();

	// First run without quiet
	await cli.parseAsync(["--format", "json"]);
	const normalJsonOutput = processStdoutWriteStub.firstCall.firstArg;
	t.true(normalJsonOutput.length > 0, "Normal JSON output is not empty");

	// Reset history for second run
	processStdoutWriteStub.resetHistory();

	// Run with quiet
	await cli.parseAsync(["--quiet", "--format", "json"]);
	const quietJsonOutput = processStdoutWriteStub.firstCall.firstArg;
	t.true(quietJsonOutput.length > 0, "Quiet JSON output is not empty");

	t.is(processExitStub.callCount, 0, "process.exit got never called");
	process.exitCode = 0; // Reset immediately

	// Parse and compare results
	const normalJson = JSON.parse(normalJsonOutput) as LintResult[];
	const quietJson = JSON.parse(quietJsonOutput) as LintResult[];

	// Verify quiet output has warningCount set to 0
	t.true(quietJson.some((file) => file.warningCount === 0),
		"Quiet JSON output has warningCount set to 0");

	// Compare with normalJson if it has any warnings
	if (normalJson.some((file) => file.warningCount > 0)) {
		t.notDeepEqual(normalJson, quietJson, "Quiet JSON output differs from normal JSON output");
	}
});

// Test for --quiet option with Markdown format
test.serial("ui5lint --quiet --format markdown", async (t) => {
	const {cli, processExitStub, processStdoutWriteStub} = t.context;

	// Reset the stub's history
	processStdoutWriteStub.resetHistory();

	// First run without quiet
	await cli.parseAsync(["--format", "markdown"]);
	const normalMarkdownOutput = processStdoutWriteStub.firstCall.firstArg;
	t.true(normalMarkdownOutput.length > 0, "Normal Markdown output is not empty");

	// Reset history for second run
	processStdoutWriteStub.resetHistory();

	// Run with quiet
	await cli.parseAsync(["--quiet", "--format", "markdown"]);
	const quietMarkdownOutput = processStdoutWriteStub.firstCall.firstArg;
	t.true(quietMarkdownOutput.length > 0, "Quiet Markdown output is not empty");

	t.is(processExitStub.callCount, 0, "process.exit got never called");
	process.exitCode = 0; // Reset immediately

	// Check outputs
	const errorMsg = "Quiet Markdown output differs from normal output";
	t.notDeepEqual(quietMarkdownOutput, normalMarkdownOutput, errorMsg);

	// Quiet output should not contain the word "warnings" in the summary
	const warnMsg = "Quiet Markdown output should not mention warnings";
	t.false(quietMarkdownOutput.includes(" warnings"), warnMsg);
});

// Always reset exit code at the end
process.exitCode = 0;
