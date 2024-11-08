import {lintProject} from "./linter/linter.js";
import type {LintResult} from "./linter/LinterContext.js";

export type {LintResult} from "./linter/LinterContext.js";
export type {UI5LintConfigType} from "./utils/ConfigManager.js";

// Define a separate interface for the Node API as there could be some differences
// in the options and behavior compared to LinterOptions internal type.
export interface UI5LinerOptions {
	/**
	 * List of patterns to lint.
	 */
	filePatterns?: string[];
	/**
	 * Pattern/files that will be ignored during linting.
	 */
	ignorePatterns?: string[];
	/**
	 * Provides complementary information for each finding, if available
	 * @default false
	 */
	details?: boolean;
	/**
	 * Path to a ui5lint.config.(cjs|mjs|js) file
	 */
	config?: string;
	/**
	 * Whether to skip loading a config file
	 * @default false
	 */
	noConfig?: boolean;
	/**
	 * Whether to provide a coverage report
	 * @default false
	 */
	coverage?: boolean;
	/**
	 * Path to a ui5.yaml file or an object representation of ui5.yaml
	 * @default "./ui5.yaml"
	 */
	ui5Config?: string | object;
	/**
	 * Root directory of the project
	 * @default process.cwd()
	 */
	rootDir?: string;
}

export async function ui5lint({
	filePatterns,
	ignorePatterns = [],
	details = false,
	config,
	noConfig,
	coverage = false,
	ui5Config = "./ui5.yaml",
	rootDir = process.cwd(),
}: UI5LinerOptions): Promise<LintResult[]> {
	return lintProject({
		rootDir,
		filePatterns,
		ignorePatterns,
		coverage,
		details,
		configPath: config,
		noConfig,
		ui5Config,
	});
}
