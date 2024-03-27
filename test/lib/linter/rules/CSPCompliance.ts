import path from "node:path";
import {fileURLToPath} from "node:url";
import {createTestsForFixtures} from "../_linterHelper.js";

const filePath = fileURLToPath(import.meta.url);
const __dirname = path.dirname(filePath);
const fileName = path.basename(filePath, ".ts");
const fixturesPath = path.join(__dirname, "..", "..", "..", "fixtures", "linter", "rules", fileName);

createTestsForFixtures(fixturesPath);
