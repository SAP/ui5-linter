import test from "ava";
import {RULES} from "../../../src/linter/messages.js";
import {readFile} from "node:fs/promises";

const rules = Object.keys(RULES);
const rulesMd = await readFile(new URL("../../../docs/Rules.md", import.meta.url), {encoding: "utf-8"});

rules.forEach((rule) => {
	test.serial(`Check documentation of '${rule}' in docs/Rules.md`, (t) => {
		t.true(rulesMd.includes(`\n## ${rule}\n`),
			`Heading exists in docs/Rules.md`);
		t.true(rulesMd.includes(`- [${rule}](#${rule})`),
			`Table of contents entry exists in docs/Rules.md`);
	});
});
