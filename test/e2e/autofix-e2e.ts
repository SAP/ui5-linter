import test from "ava";
import {readdir, readFile} from "node:fs/promises";
import path from "node:path";

const E2E_DIR_URL = new URL("../tmp/e2e/com.ui5.troublesome.app", import.meta.url);

test.serial("Compare com.ui5.troublesome.app result snapshots", async (t) => {
	const projectFiles = (await readdir(E2E_DIR_URL, {withFileTypes: true, recursive: true}))
		.filter((dirEntries) => {
			return dirEntries.isFile() && dirEntries.name !== ".DS_Store";
		});

	for (const file of projectFiles) {
		const content = await readFile(path.join(file.path, file.name), {encoding: "utf-8"});
		t.snapshot(`${file.name}:\n${content}`);
	}
});
