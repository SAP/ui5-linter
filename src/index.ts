import {lintProject} from "./linter/linter.js";
import type {LintResult} from "./linter/LinterContext.js";

export type {LintResult} from "./linter/LinterContext.js";

// Define a separate interface for the Node API as there could be some differences
// in the options and behavior compared to LinterOptions internal type.
export interface UI5LinterOptions {
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
	 * Whether to skip loading of the ui5lint.config.(cjs|mjs|js) config file
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
	 * @default "./ui5.yaml" (if that file exists)
	 */
	ui5Config?: string | object;
	/**
	 * Root directory of the project
	 * @default process.cwd()
	 */
	rootDir?: string;
}

export async function ui5lint(options?: UI5LinterOptions): Promise<LintResult[]> {
	const {
		filePatterns,
		ignorePatterns = [],
		details = false,
		config,
		noConfig,
		coverage = false,
		ui5Config,
		rootDir = process.cwd(),
	} = options ?? {};

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
