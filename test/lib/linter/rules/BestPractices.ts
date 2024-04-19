import { fileURLToPath } from "node:url";
import { runLintRulesTests } from "../_linterHelper.js";
import path from "node:path";
import { readdirSync, lstatSync } from "node:fs";

const filePath = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filePath);
const fileName = path.basename(filePath, ".ts");
const fixturesPath = path.join(__dirname, "..", "..", "..", "fixtures", "linter", "rules", fileName);

const testSubDirs = readdirSync(fixturesPath);

for (const subDir of testSubDirs) {
	const dirPath = path.join(fixturesPath, subDir);
	if (!subDir.startsWith("_") && lstatSync(dirPath).isDirectory()) {
		runLintRulesTests(fileName, dirPath);
	}
}
