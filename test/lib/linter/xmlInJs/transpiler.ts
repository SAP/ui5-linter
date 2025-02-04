import path from "node:path";
import {fileURLToPath} from "node:url";
import {createTestsForFixtures} from "../_linterHelper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, "..", "..", "..", "fixtures", "transpiler", "xml-in-js");

createTestsForFixtures(fixtures);
