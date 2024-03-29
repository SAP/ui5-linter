import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import base from "./cli/base.js";
import {fileURLToPath} from "node:url";
import {setVersion} from "./cli/version.js";
import {createRequire} from "module";

import type {Package} from "update-notifier";

export default async function () {
	const require = createRequire(import.meta.url);
	const pkg = require("../package.json") as Package;

	// Only import update-notifier when it's not disabled
	// See https://github.com/yeoman/update-notifier/blob/3046d0f61a57f8270291b6ab271f8a12df8421a6/update-notifier.js#L57-L60
	// The "is-ci" check is not executed, but will be checked by update-notifier itself then
	const NO_UPDATE_NOTIFIER = "--no-update-notifier";
	const disableUpdateNotifier =
		"NO_UPDATE_NOTIFIER" in process.env ||
		process.env.NODE_ENV === "test" ||
		process.argv.includes(NO_UPDATE_NOTIFIER);

	if (!disableUpdateNotifier) {
		const {default: updateNotifier} = await import("update-notifier");
		updateNotifier({
			pkg,
			updateCheckInterval: 86400000, // 1 day
			shouldNotifyInNpmScript: true,
		}).notify();
	}

	// Remove --no-update-notifier from argv as it's not known to yargs, but we still want to support using it
	if (process.argv.includes(NO_UPDATE_NOTIFIER)) {
		process.argv = process.argv.filter((v) => v !== NO_UPDATE_NOTIFIER);
	}

	const cli = yargs(hideBin(process.argv));
	cli.parserConfiguration({
		"parse-numbers": false,
	});

	// Explicitly set CLI version as the yargs default might
	// be wrong in case a local CLI installation is used
	// Also add CLI location
	const ui5LintJsPath = fileURLToPath(new URL("../bin/ui5lint.js", import.meta.url));
	const pkgVersion = `${pkg.version} (from ${ui5LintJsPath})`;

	setVersion(pkgVersion);
	cli.version(pkgVersion);

	// Explicitly set script name to prevent windows from displaying "ui5-linter.js"
	cli.scriptName("ui5lint");

	// Setup base command
	base(cli);

	// Format terminal output to full available width
	cli.wrap(cli.terminalWidth());

	// await cli.parse();
	// yargs registers a get method on the argv property.
	// The property needs to be accessed to initialize everything.
	await cli.argv;
}
