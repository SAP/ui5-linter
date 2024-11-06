import {lintProject} from "./linter/linter.js";
import type {LintResult} from "./linter/LinterContext.js";

export {LintResult} from "./linter/LinterContext.js";

// Define a separate interface for the Node API as there could be some differences
// in the options and behavior compared to LinterOptions internal type.
export interface UI5LintOptions {
	filePatterns?: string[];
	ignorePatterns: string[];
	details: boolean;
	config: string | null; // (null | string (default: "ui5lint.config.{js,mjs,cjs}"; null should suppress reading the default config file, a string overwrites the default path)
	// boolean | string (default / true: "ui5lint.config.{js,mjs,cjs}"; false should suppress reading the default config file)
	// string (default: "ui5lint.config.{js,mjs,cjs}"; empty string should suppress reading the default config file)
	// separate noConfig option to suppress reading the default config file
	coverage: boolean; // boolean(default: false)
	ui5Config: string | object; // string | object (default: "./ui5.yaml"; object allows to pass a JSON representation of a ui5.yaml config)
	// Do we need a way to suppress reading a ui5.yaml? For now we don't have a use case, so for now we will not provide a way to suppress it
	// As already with the CLI: If no ui5.yaml exists, the default logic to check for webapp / src / test folder should still apply to support most projects without a ui5.yaml
	rootDir: string;
}

export async function ui5lint({
	filePatterns,
	ignorePatterns = [],
	details = false,
	config = null,
	coverage = false,
	ui5Config = "./ui5.yaml",
	rootDir = process.cwd(),
}: UI5LintOptions): Promise<LintResult[]> {
	return lintProject({
		rootDir,
		filePatterns,
		ignorePattern: ignorePatterns,
		reportCoverage: coverage,
		includeMessageDetails: details,
		configPath: config ?? undefined,
		ui5ConfigPath: ui5Config ?? undefined,
	});
}
