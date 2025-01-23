import {fileURLToPath} from "node:url";
import {runLintRulesTests} from "../linter/_linterHelper.js";

const filePath = fileURLToPath(import.meta.url);
runLintRulesTests(filePath, fileURLToPath(new URL("../../fixtures/autofix", import.meta.url)), /* fix */ true);
