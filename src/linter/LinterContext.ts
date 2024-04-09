import {AbstractAdapter, AbstractReader} from "@ui5/fs";
import {createReader} from "@ui5/fs/resourceFactory";

export type FilePath = string;

// Data types are structured very similar to the ESLint types for better compatibility into existing integrations:
// https://eslint.org/docs/latest/integrate/nodejs-api#-lintresult-type
export interface LintResult {
	filePath: FilePath;
	messages: LintMessage[];
	coverageInfo: CoverageInfo[];
	errorCount: number; // includes fatal errors
	fatalErrorCount: number;
	warningCount: number;
}

export enum LintMessageSeverity {
	Warning = 1,
	Error = 2,
}

export interface LintMessage {
	ruleId: string;
	severity: LintMessageSeverity;
	message: string;
	messageDetails?: string;
	fatal?: boolean | undefined; // e.g. parsing error
	line?: number | undefined; // 1 based to be aligned with most IDEs
	column?: number | undefined; // 1 based to be aligned with most IDEs
	endLine?: number | undefined;
	endColumn?: number | undefined;
}

export enum CoverageCategory {
	CallExpressionUnknownType = 1,
}

export interface CoverageInfo {
	category: CoverageCategory;
	message: string;
	messageDetails?: string;
	line?: number | undefined; // 1 based to be aligned with most IDEs
	column?: number | undefined; // 1 based to be aligned with most IDEs
	endLine?: number | undefined;
	endColumn?: number | undefined;
}

export interface TranspileResult {
	source: string;
	map: string;
}

export interface LinterOptions {
	rootDir: string;
	namespace?: string;
	filePaths?: FilePath[];
	reportCoverage?: boolean;
	messageDetails?: boolean;
}

export interface LinterParameters {
	workspace: AbstractAdapter;
	context: LinterContext;
}

export interface PositionInfo {
	line: number;
	column: number;
}

export interface PositionRange {
	start: PositionInfo;
	end?: PositionInfo;
}

export interface LintMetadata {
	// TODO: Use this to store information shared across linters,
	// such as the async flag state in manifest.json which might be relevant
	// when parsing the Component.js
	_todo: string;
}

export default class LinterContext {
	#rootDir: string;
	#namespace: string | undefined;
	#messages = new Map<FilePath, LintMessage[]>();
	#coverageInfo = new Map<FilePath, CoverageInfo[]>();
	#metadata = new Map<FilePath, LintMetadata>();
	#rootReader: AbstractReader | undefined;

	#filePaths: FilePath[] | undefined;
	// Mapping original file paths to aliases, such as the paths of transpiled resources
	#filePathAliases = new Map<FilePath, FilePath>();

	#reportCoverage: boolean;
	#messageDetails: boolean;

	constructor(options: LinterOptions) {
		this.#rootDir = options.rootDir;
		this.#namespace = options.namespace;
		this.#filePaths = options.filePaths ? [...options.filePaths] : undefined;
		this.#reportCoverage = !!options.reportCoverage;
		this.#messageDetails = !!options.messageDetails;
	}

	getRootDir(): string {
		return this.#rootDir;
	}

	getRootReader(): AbstractReader {
		if (this.#rootReader) {
			return this.#rootReader;
		}
		this.#rootReader = createReader({
			fsBasePath: this.#rootDir,
			virBasePath: "/",
		});
		return this.#rootReader;
	}

	getNamespace(): string | undefined {
		return this.#namespace;
	}

	getFilePaths(): FilePath[] | undefined {
		return this.#filePaths;
	}

	getReportCoverage(): boolean {
		return this.#reportCoverage;
	}

	getMessageDetails(): boolean {
		return this.#messageDetails;
	}

	getMetadata(filePath: FilePath): LintMetadata {
		let metadata = this.#metadata.get(filePath);
		if (!metadata) {
			metadata = {} as LintMetadata;
			this.#metadata.set(filePath, metadata);
		}
		return metadata;
	}

	addFilePathToLint(filePath: FilePath) {
		this.#filePaths?.push(filePath);
	}

	getLintingMessages(filePath: FilePath): LintMessage[] {
		let messages = this.#messages.get(filePath);
		if (!messages) {
			messages = [];
			this.#messages.set(filePath, messages);
		}
		return messages;
	}

	addLintingMessage(filePath: FilePath, message: LintMessage) {
		this.getLintingMessages(filePath).push(message);
	}

	getCoverageInfo(filePath: FilePath): CoverageInfo[] {
		let coverageInfo = this.#coverageInfo.get(filePath);
		if (!coverageInfo) {
			coverageInfo = [];
			this.#coverageInfo.set(filePath, coverageInfo);
		}
		return coverageInfo;
	}

	addCoverageInfo(filePath: FilePath, coverageInfo: CoverageInfo) {
		this.getCoverageInfo(filePath).push(coverageInfo);
	}

	generateLintResult(filePath: FilePath): LintResult {
		const messages = this.#messages.get(filePath) ?? [];
		const coverageInfo = this.#coverageInfo.get(filePath) ?? [];
		let errorCount = 0;
		let warningCount = 0;
		let fatalErrorCount = 0;
		for (const message of messages) {
			if (message.severity === LintMessageSeverity.Error) {
				errorCount++;
				if (message.fatal) {
					fatalErrorCount++;
				}
			} else {
				warningCount++;
			}
		}

		// Map aliases back to the original file
		if (this.#filePathAliases.has(filePath)) {
			filePath = this.#filePathAliases.get(filePath)!;
		}

		return {
			filePath,
			messages,
			coverageInfo,
			errorCount,
			warningCount,
			fatalErrorCount,
		};
	}

	generateLintResults(): LintResult[] {
		const lintResults: LintResult[] = [];
		let filePaths;
		if (this.#reportCoverage) {
			filePaths = new Set([...this.#messages.keys(), ...this.#coverageInfo.keys()]).values();
		} else {
			filePaths = this.#messages.keys();
		}
		for (const filePath of filePaths) {
			lintResults.push(this.generateLintResult(filePath));
		}
		return lintResults;
	}
}
