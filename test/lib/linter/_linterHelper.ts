import anyTest, {ExecutionContext, TestFn} from "ava";
import sinonGlobal, {SinonStub} from "sinon";
import util from "util";
import {readdirSync} from "node:fs";
import esmock from "esmock";
import {LintResult} from "../../../src/detectors/AbstractDetector.js";
import FileLinter from "../../../src/detectors/typeChecker/FileLinter.js";
import {SourceFile, TypeChecker} from "typescript";

util.inspect.defaultOptions.depth = 4; // Increase AVA's printing depth since coverageInfo objects are on level 4

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
	lintFile: SinonStub;
}>;

test.before(async (t) => {
	const {lintModule: {lintFile}} = await esmockDeprecationText();
	t.context.lintFile = lintFile;
});

// Mock getDeprecationText as we do not have control over the deprecated texts and they could
// change anytime creating false positive failing tests. That way is ensured consistent and testable behavior.
export async function esmockDeprecationText() {
	const checkerModule = await esmock("../../../src/detectors/typeChecker/index.js", {
		"../../../src/detectors/typeChecker/FileLinter.js":
		function (
			rootDir: string, filePath: string, sourceFile: SourceFile,
			sourceMap: string | undefined, checker: TypeChecker
		) {
			// Don't use sinon's stubs as it's hard to clean after them in this case and it leaks memory.
			const linter = new FileLinter(rootDir, filePath, sourceFile, sourceMap, checker);
			linter.getDeprecationText = () => "Deprecated test message";
			return linter;
		},
	});

	const lintModule = await esmock("../../../src/linter/linter.js", {
		"../../../src/detectors/typeChecker/index.js": checkerModule,
	});

	return {lintModule, checkerModule};
}

// Helper function to compare file paths since we don't want to store those in the snapshots
export function assertExpectedLintResults(
	t: ExecutionContext, res: LintResult[], basePath: string, filePaths: string[]) {
	res.forEach((lintResult) => {
		if (!filePaths.includes(lintResult.filePath)) {
			t.fail(`Unexpected lint result for file ${lintResult.filePath}. Expected: ${filePaths.join(", ")}`);
		}
	});
}

// Helper function to create linting tests for all files in a directory
export function createTestsForFixtures(fixturesPath: string) {
	try {
		const testFiles = readdirSync(fixturesPath);
		if (!testFiles.length) {
			throw new Error(`Failed to find any fixtures in directory ${fixturesPath}`);
		}
		for (const fileName of testFiles) {
			if (!fileName.endsWith(".js") && !fileName.endsWith(".xml") && !fileName.endsWith(".json")) {
				// Ignore non-JavaScript, non-XML and non-JSON files
				continue;
			}

			let testName = fileName;
			let defineTest = test.serial;
			if (fileName.startsWith("_")) {
				// Skip tests for files starting with underscore
				defineTest = defineTest.skip as typeof test;
				testName = fileName.slice(1);
			} else if (fileName.startsWith("only_")) {
				// Only run test when file starts with only_
				defineTest = defineTest.only as typeof test;
				testName = fileName.slice(5);
			}
			// Executing linting in parallel might lead to OOM errors in the CI
			// Therefore always use serial
			defineTest(`General: ${testName}`, async (t) => {
				const filePaths = [fileName];
				const {lintFile} = t.context;

				const res = await lintFile({
					rootDir: fixturesPath,
					filePaths,
				});
				assertExpectedLintResults(t, res, fixturesPath, filePaths);
				res.forEach((results: {filePath: string}) => {
					results.filePath = testName;
				});
				t.snapshot(res);
			});
		}
	} catch (err) {
		if (err instanceof Error) {
			throw new Error(
				`Failed to list files of directory ${fixturesPath}: ${err.message}`);
		}
		throw err;
	}
}
