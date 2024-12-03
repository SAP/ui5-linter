import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import base from "./cli/base.js";
import {fileURLToPath} from "node:url";
import {getFormattedVersion, setVersionInfo} from "./cli/version.js";
import {createRequire} from "module";

export default async function () {
	const cli = yargs(hideBin(process.argv));
	cli.parserConfiguration({
		"parse-numbers": false,
	});

	// Explicitly set CLI version as the yargs default might
	// be wrong in case a local CLI installation is used
	// Also add CLI location
	const require = createRequire(import.meta.url);
	const pkg = require("../package.json") as {version: string};
	const ui5LintJsPath = fileURLToPath(new URL("../bin/ui5lint.js", import.meta.url));

	setVersionInfo(pkg.version, ui5LintJsPath);
	cli.version(getFormattedVersion());

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
