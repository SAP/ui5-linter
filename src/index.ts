import {lintProject} from "./linter/linter.js";
import type {LintResult} from "./linter/LinterContext.js";

export {LintResult} from "./linter/LinterContext.js";
export {UI5LintConfigType} from "./utils/ConfigManager.js";

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
	ui5Config: string | object;
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
		ui5Config,
	});
}
