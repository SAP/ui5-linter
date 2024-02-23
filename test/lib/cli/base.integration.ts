import anyTest, { TestFn } from "ava";
import sinon, { SinonStub } from "sinon";
import yargs from "yargs";
import path from "node:path";
import cliBase from "../../../src/cli/base.js";
import { fileURLToPath } from "node:url";
import { LintResult } from "../../../src/detectors/AbstractDetector.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleProjectPath = path.join(__dirname, "..", "..", "fixtures", "linter", "projects", "com.ui5.troublesome.app");

const test = anyTest as TestFn<{
	consoleLogStub: SinonStub,
    processCwdStub: SinonStub,
	processStdoutWriteStub: SinonStub,
	cli: yargs.Argv,
}>;

test.beforeEach(async (t) => {
	t.context.consoleLogStub = sinon.stub(console, "log");
	t.context.processCwdStub = sinon.stub(process, "cwd").returns(sampleProjectPath);
	t.context.processStdoutWriteStub = sinon.stub(process.stdout, "write").returns(true);
	t.context.cli = yargs();
	cliBase(t.context.cli);
});

test.afterEach.always(() => {
	sinon.restore();
});

// Test if standard output is parsable JSON
test.serial("ui5lint --format json", async (t) => {
	const { cli } = t.context;
	
	await cli.parseAsync(["--format", "json"]);

	t.is(t.context.consoleLogStub.callCount, 0, "console.log should not be used");
	t.true(t.context.processCwdStub.callCount > 0, "process.cwd was called");
	t.is(t.context.processStdoutWriteStub.callCount, 1, "process.stdout.write is only used once");

	const resultProcessStdout = t.context.processStdoutWriteStub.firstCall.firstArg;
	let parsedJson: LintResult[];
	
	t.notThrows(() => parsedJson = JSON.parse(resultProcessStdout), "Output of process.stdout.write is JSON-formatted");
	t.true(Array.isArray(parsedJson!), "The parsed JSON output is a LintResult array");
	t.true(parsedJson!.length > 0, "The parsed JSON output contains at least one result");
});
