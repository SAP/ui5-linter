import {fileURLToPath} from "node:url";
import {runLintRulesTests} from "../_linterHelper.js";
import path from "node:path";

const filePath = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filePath);
const fileName = path.basename(filePath, ".ts");
const fixturesPath = path.join(__dirname, "..", "..", "..", "fixtures", "linter", "rules", fileName);

runLintRulesTests(fileName, path.join(fixturesPath, "Negative_1"));
runLintRulesTests(fileName, path.join(fixturesPath, "Negative_2"));

runLintRulesTests(fileName, path.join(fixturesPath, "Positive_1"));
runLintRulesTests(fileName, path.join(fixturesPath, "Positive_2"));
