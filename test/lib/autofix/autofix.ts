import anyTest, {TestFn} from "ava";
import sinonGlobal from "sinon";
import path from "node:path";
import {readdirSync} from "node:fs";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import autofix, {AutofixResource} from "../../../src/autofix/autofix.js";
import {RawLintMessage, ResourcePath} from "../../../src/linter/LinterContext.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, "..", "..", "fixtures", "autofix");

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
}>;

test.before((t) => {
	t.context.sinon = sinonGlobal.createSandbox();
});
test.after.always((t) => {
	t.context.sinon.restore();
});
createTestsForFixtures();

function createTestsForFixtures() {
	try {
		const testFiles = readdirSync(fixturesPath, {withFileTypes: true, recursive: true}).filter((dirEntries) => {
			return dirEntries.isFile() && dirEntries.name !== ".DS_Store";
		}).map((dirEntries) => {
			return path.posix.join(
				// Resolve relative path OS dependant, but do the join in POSIX format
				path.relative(fixturesPath, dirEntries.path),
				dirEntries.name
			);
		});
		if (!testFiles.length) {
			throw new Error(`Failed to find any fixtures in directory ${fixturesPath}`);
		}
		if (fixturesPath.includes("<NEVER MATCH>")) { // Future: Use this case to test cross-file autofixing
			const dirName = path.basename(fixturesPath);
			testDefinition({
				testName: dirName,
				namespace: "mycomp",
				fileName: dirName,
				fixturesPath,
				filePaths: testFiles,
			});
		} else {
			for (const fileName of testFiles) {
				if (!fileName.endsWith(".js") &&
					!fileName.endsWith(".ts") &&
					!fileName.endsWith(".xml") &&
					!fileName.endsWith(".json") &&
					!fileName.endsWith(".html") &&
					!fileName.endsWith(".yaml")) {
					// Ignore non-JavaScript, non-TypeScript, non-XML, non-JSON, non-HTML and non-YAML files
					continue;
				}

				testDefinition({
					testName: fileName,
					namespace: "mycomp",
					fileName,
					fixturesPath,
					filePaths: [fileName],
				});
			}
		}
	} catch (err) {
		if (err instanceof Error) {
			throw new Error(
				`Failed to list files of directory ${fixturesPath}: ${err.message}`);
		}
		throw err;
	}
}

function testDefinition(
	{testName, fileName, fixturesPath, filePaths, namespace}:
	{testName: string; fileName: string; fixturesPath: string; filePaths: string[]; namespace: string}) {
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
		const resources = await Promise.all(filePaths.map(async (fileName) => {
			return [fileName, {
				content: await readFile(path.join(fixturesPath, fileName), "utf-8"),
				messages: await readMessages(fileName),
			}] as [ResourcePath, AutofixResource];
		}));

		const res = await autofix({
			rootDir: fixturesPath,
			namespace,
			resources: new Map(resources),
		});

		for (const [filePath, content] of res.entries()) {
			let newFilePath;
			const resultFileName = path.basename(filePath);
			if (resultFileName === fileName) {
				// Use "clean" testName instead of the fileName which might contain modifiers like "only_"
				newFilePath = testName;
			} else {
				// Use only the file name without the directory (which might contain modifiers)
				newFilePath = resultFileName;
			}
			if (filePath !== newFilePath) {
				res.delete(filePath);
				res.set(newFilePath, content);
			}
		}
		if (res.size === 1) {
			t.snapshot(res.values().next().value);
		} else {
			t.snapshot(res);
		}
	});
}

async function readMessages(filePath: string): Promise<RawLintMessage[]> {
	const content = await readFile(path.join(fixturesPath, `${filePath}.report`), "utf-8");
	if (!content) {
		throw new Error(`Failed to read file ${filePath}`);
	}
	return JSON.parse(content);
}
