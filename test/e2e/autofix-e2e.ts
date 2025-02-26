import {fileURLToPath} from "node:url";
import {runLintRulesTests} from "../lib/linter/_linterHelper.js";

const filePath = fileURLToPath(import.meta.url);
runLintRulesTests(filePath,
	fileURLToPath(new URL("../fixtures/linter/projects/com.ui5.troublesome.app", import.meta.url)), /* fix */ true);
