import {AbstractAdapter, AbstractReader} from "@ui5/fs";
import {createReader} from "@ui5/fs/resourceFactory";
import {resolveLinks} from "../formatter/lib/resolveLinks.js";

export type FilePath = string; // Platform-dependent path
export type ResourcePath = string; // Always POSIX

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
	pathsToLint?: FilePath[];
	reportCoverage?: boolean;
	includeMessageDetails?: boolean;
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
	#messages = new Map<ResourcePath, LintMessage[]>();
	#coverageInfo = new Map<ResourcePath, CoverageInfo[]>();
	#metadata = new Map<ResourcePath, LintMetadata>();
	#rootReader: AbstractReader | undefined;

	#resourcePathsToLint: ResourcePath[] | undefined;

	#reportCoverage: boolean;
	#includeMessageDetails: boolean;

	constructor(options: LinterOptions) {
		this.#rootDir = options.rootDir;
		this.#namespace = options.namespace;
		this.#resourcePathsToLint = options.pathsToLint ? [...options.pathsToLint] : undefined;
		this.#reportCoverage = !!options.reportCoverage;
		this.#includeMessageDetails = !!options.includeMessageDetails;
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

	getPathsToLint(): ResourcePath[] | undefined {
		return this.#resourcePathsToLint;
	}

	getReportCoverage(): boolean {
		return this.#reportCoverage;
	}

	getIncludeMessageDetails(): boolean {
		return this.#includeMessageDetails;
	}

	getMetadata(resourcePath: ResourcePath): LintMetadata {
		let metadata = this.#metadata.get(resourcePath);
		if (!metadata) {
			metadata = {} as LintMetadata;
			this.#metadata.set(resourcePath, metadata);
		}
		return metadata;
	}

	addPathToLint(resourcePath: ResourcePath) {
		this.#resourcePathsToLint?.push(resourcePath);
	}

	getLintingMessages(resourcePath: ResourcePath): LintMessage[] {
		let messages = this.#messages.get(resourcePath);
		if (!messages) {
			messages = [];
			this.#messages.set(resourcePath, messages);
		}
		return messages;
	}

	addLintingMessage(resourcePath: ResourcePath, message: LintMessage) {
		if (message.messageDetails) {
			message.messageDetails = resolveLinks(message.messageDetails);
		}

		this.getLintingMessages(resourcePath).push(message);
	}

	getCoverageInfo(resourcePath: ResourcePath): CoverageInfo[] {
		let coverageInfo = this.#coverageInfo.get(resourcePath);
		if (!coverageInfo) {
			coverageInfo = [];
			this.#coverageInfo.set(resourcePath, coverageInfo);
		}
		return coverageInfo;
	}

	addCoverageInfo(resourcePath: ResourcePath, coverageInfo: CoverageInfo) {
		this.getCoverageInfo(resourcePath).push(coverageInfo);
	}

	generateLintResult(resourcePath: ResourcePath): LintResult {
		const messages = this.#messages.get(resourcePath) ?? [];
		const coverageInfo = this.#coverageInfo.get(resourcePath) ?? [];
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

		return {
			filePath: resourcePath,
			messages,
			coverageInfo,
			errorCount,
			warningCount,
			fatalErrorCount,
		};
	}

	generateLintResults(): LintResult[] {
		const lintResults: LintResult[] = [];
		let resourcePaths;
		if (this.#reportCoverage) {
			resourcePaths = new Set([...this.#messages.keys(), ...this.#coverageInfo.keys()]).values();
		} else {
			resourcePaths = this.#messages.keys();
		}

		for (const resourcePath of resourcePaths) {
			lintResults.push(this.generateLintResult(resourcePath));
		}

		return lintResults;
	}
}
