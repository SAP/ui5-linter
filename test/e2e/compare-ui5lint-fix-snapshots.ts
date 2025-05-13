import test from "ava";
import {readdir, readFile} from "node:fs/promises";
import path from "node:path";

const E2E_DIR_URL = new URL("../tmp/e2e/", import.meta.url);
const APP_DIR_URL = new URL("../tmp/e2e/com.ui5.troublesome.app", import.meta.url);

test.serial("Compare 'ui5lint --fix' com.ui5.troublesome.app result snapshots", async (t) => {
	const stderr = await readFile(new URL("stderr-fix.log", E2E_DIR_URL), {encoding: "utf-8"});
	t.snapshot(stderr);
	const results = JSON.parse(await readFile(new URL("ui5lint-results-fix.json", E2E_DIR_URL), {encoding: "utf-8"}));
	t.snapshot(results);

	const projectFiles = (await readdir(APP_DIR_URL, {withFileTypes: true, recursive: true}))
		.filter((dirEntries) => {
			return dirEntries.isFile() && dirEntries.name !== ".DS_Store";
		});

	for (const file of projectFiles) {
		const content = await readFile(path.join(file.parentPath || file.path, file.name), {encoding: "utf-8"});
		t.snapshot(`${file.name}:\n${content}`);
	}
});
