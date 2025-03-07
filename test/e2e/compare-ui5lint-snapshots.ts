import test from "ava";
import {readFile} from "node:fs/promises";

const E2E_DIR_URL = new URL("../tmp/e2e/", import.meta.url);

test.serial("Compare 'ui5lint' com.ui5.troublesome.app result snapshots", async (t) => {
	const stderr = await readFile(new URL("stderr.log", E2E_DIR_URL), {encoding: "utf-8"});
	t.snapshot(stderr);
	const results = JSON.parse(await readFile(new URL("ui5lint-results.json", E2E_DIR_URL), {encoding: "utf-8"}));
	t.snapshot(results);
});
