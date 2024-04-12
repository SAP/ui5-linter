import anyTest, {TestFn} from "ava";
import sinonGlobal from "sinon";
import path from "node:path";
import util from "util";
import {readdirSync} from "node:fs";
import fs from "node:fs/promises";
import transpileAmdToEsm from "../../../../src/linter/ui5Types/amdTranspiler/transpiler.js";

util.inspect.defaultOptions.depth = 4; // Increase AVA's printing depth since coverageInfo objects are on level 4

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
}>;

// Helper function to create linting tests for all files in a directory
export function createTestsForFixtures(fixturesPath: string) {
	try {
		const testFiles = readdirSync(fixturesPath);
		if (!testFiles.length) {
			throw new Error(`Failed to find any fixtures in directory ${fixturesPath}`);
		}
		for (const fileName of testFiles) {
			if (!fileName.endsWith(".js")) {
				// Ignore non-JavaScript files
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
			defineTest(`Transpile ${testName}`, async (t) => {
				const filePath = path.join(fixturesPath, fileName);
				const fileContent = await fs.readFile(filePath);
				const {source, map} = transpileAmdToEsm(testName, fileContent.toString(), true);
				t.snapshot(source);
				t.snapshot(map && JSON.parse(map));
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
