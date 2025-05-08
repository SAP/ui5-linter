import test from "ava";
import path from "node:path";
import fs from "node:fs/promises";
import child_process from "node:child_process";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
const execFile = promisify(child_process.execFile);

const UI5LINT_BIN = fileURLToPath(new URL("../../bin/ui5lint.js", import.meta.url));

const RUNTIME_DIR = fileURLToPath(new URL("../../test/fixtures/e2e/runtime", import.meta.url));

const TMP_RUNTIME_DIR = fileURLToPath(new URL("../../test/tmp/e2e/runtime", import.meta.url));
const TMP_RUNTIME_DIR_AUTOFIX = fileURLToPath(new URL("../../test/tmp/e2e/runtime-autofix", import.meta.url));

async function copyDir(src: string, dest: string) {
	await fs.mkdir(dest, {recursive: true});
	const entries = await fs.readdir(src, {withFileTypes: true});

	await Promise.all(entries.map(async (entry) => {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory() && entry.name !== "node_modules") {
			await copyDir(srcPath, destPath);
		} else {
			await fs.copyFile(srcPath, destPath);
		}
	}));
}

test.serial("Run tests before autofix", async (t) => {
	await fs.rm(TMP_RUNTIME_DIR, {recursive: true, force: true});
	await copyDir(RUNTIME_DIR, TMP_RUNTIME_DIR);

	await t.notThrowsAsync(execFile("npm", ["test"], {
		cwd: TMP_RUNTIME_DIR,
	}));
});

test.serial("Run tests after autofix", async (t) => {
	await fs.rm(TMP_RUNTIME_DIR_AUTOFIX, {recursive: true, force: true});
	await copyDir(RUNTIME_DIR, TMP_RUNTIME_DIR_AUTOFIX);

	await t.notThrowsAsync(execFile("node", [UI5LINT_BIN, "--fix"], {
		cwd: TMP_RUNTIME_DIR_AUTOFIX,
	}));

	await t.notThrowsAsync(execFile("npm", ["test"], {
		cwd: TMP_RUNTIME_DIR_AUTOFIX,
	}));
});
