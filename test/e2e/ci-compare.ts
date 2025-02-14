/* eslint ava/no-ignored-test-files: "error" */
import test from "ava";
import {createRequire} from "node:module";

// Using CommonsJS require since JSON module imports are still experimental
const require = createRequire(import.meta.url);

test.serial("Compare snapshots", (t) => {
	const results = require("../../ui5lint-e2e-results.json");

	t.snapshot(results);
});
