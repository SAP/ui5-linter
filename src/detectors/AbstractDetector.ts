import {Project} from "@ui5/project";

// Data types are structured very similar to the ESLint types for better compatibility into existing integrations:
// https://eslint.org/docs/latest/integrate/nodejs-api#-lintresult-type
export interface LintResult {
	filePath: string,
	messages: LintMessage[],
	coverageInfo: CoverageInfo[],
	errorCount: number, // includes fatal errors
	fatalErrorCount: number,
	warningCount: number,
}

export enum LintMessageSeverity {
	Warning = 1,
	Error = 2
}

export interface LintMessage {
	ruleId: string,
	severity: LintMessageSeverity,
	message: string,
	messageDetails?: string,
	fatal?: boolean | undefined, // e.g. parsing error
	line?: number | undefined, // 1 based to be aligned with most IDEs
	column?: number | undefined, // 1 based to be aligned with most IDEs
	endLine?: number | undefined,
	endColumn?: number | undefined
}

export enum CoverageCategory {
	CallExpressionUnknownType = 1,
}

export interface CoverageInfo {
	category: CoverageCategory
	message: string,
	messageDetails?: string,
	line?: number | undefined, // 1 based to be aligned with most IDEs
	column?: number | undefined, // 1 based to be aligned with most IDEs
	endLine?: number | undefined,
	endColumn?: number | undefined
}

// export interface DetectorCapabilities {
// 	// TODO: Expose supported file types and names
// }

abstract class AbstractDetector {
	abstract createReports(filePaths: string[]): Promise<LintResult[]>
	// abstract getCapabilities(): DetectorCapabilities
}
export abstract class FileBasedDetector extends AbstractDetector{
	rootDir: string;

	constructor(rootDir: string) {
		super();
		this.rootDir = rootDir;
	}
}

export abstract class ProjectBasedDetector extends AbstractDetector{
	project: Project;

	constructor(project: Project) {
		super();
		this.project = project;
	}
}
