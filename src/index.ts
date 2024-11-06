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
	config?: string;
	noConfig?: boolean;
	coverage: boolean; // boolean(default: false)
	ui5Config: string | object;
	rootDir: string;
}

export async function ui5lint({
	filePatterns,
	ignorePatterns = [],
	details = false,
	config,
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
		configPath: config,
		ui5Config,
	});
}
