import {AbstractAdapter, AbstractReader} from "@ui5/fs";
import {createReader} from "@ui5/fs/resourceFactory";
import {resolveLinks} from "../formatter/lib/resolveLinks.js";
import {LintMessageSeverity, MESSAGE, MESSAGE_INFO} from "./messages.js";
import {MessageArgs} from "./MessageArgs.js";

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

export interface RawLintMessage<M extends MESSAGE = MESSAGE> {
	id: M;
	args: MessageArgs[M];
	position?: PositionInfo;
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
	ignorePattern?: string[];
	reportCoverage?: boolean;
	includeMessageDetails?: boolean;
	configPath?: string;
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
	#rawMessages = new Map<ResourcePath, RawLintMessage[]>();
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

	setRootReader(rootReader: AbstractReader): void {
		if (this.#rootReader) {
			throw new Error("Root reader is already defined");
		}

		this.#rootReader = rootReader;
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

	getRawLintingMessages(resourcePath: ResourcePath): RawLintMessage[] {
		let rawMessages = this.#rawMessages.get(resourcePath);
		if (!rawMessages) {
			rawMessages = [];
			this.#rawMessages.set(resourcePath, rawMessages);
		}
		return rawMessages;
	}

	addLintingMessage<M extends MESSAGE>(
		resourcePath: ResourcePath, id: M, args: MessageArgs[M]
	): void;
	addLintingMessage<M extends MESSAGE>(
		resourcePath: ResourcePath, id: M, args: MessageArgs[M], position: PositionInfo
	): void;
	addLintingMessage<M extends MESSAGE>(
		resourcePath: ResourcePath, id: M, args: MessageArgs[M], position?: PositionInfo
	) {
		this.getRawLintingMessages(resourcePath).push({id, args, position});
	}

	addLintingMessages<M extends MESSAGE>(
		resourcePath: ResourcePath, rawMessages: RawLintMessage<M>[]
	) {
		this.getRawLintingMessages(resourcePath).push(...rawMessages);
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

	#getMessageFromRawMessage<M extends MESSAGE>(rawMessage: RawLintMessage<M>): LintMessage {
		const messageInfo = MESSAGE_INFO[rawMessage.id];
		if (!messageInfo) {
			throw new Error(`Invalid message id '${rawMessage.id}'`);
		}

		const messageFunc = messageInfo.message as (args: MessageArgs[M]) => string;

		const message: LintMessage = {
			ruleId: messageInfo.ruleId,
			severity: messageInfo.severity,
			line: rawMessage.position ? rawMessage.position.line : undefined,
			column: rawMessage.position ? rawMessage.position.column : undefined,
			message: messageFunc(rawMessage.args || {}),
		};

		if (this.#includeMessageDetails) {
			const detailsFunc = messageInfo.details as (args: MessageArgs[M]) => string | undefined;
			const messageDetails = detailsFunc(rawMessage.args || {});
			if (messageDetails) {
				message.messageDetails = resolveLinks(messageDetails);
			}
		}

		if ("fatal" in messageInfo && typeof messageInfo.fatal === "boolean") {
			message.fatal = messageInfo.fatal;
		}

		if (message.fatal && message.severity !== LintMessageSeverity.Error) {
			throw new Error(`Reports flagged as "fatal" must be of severity "Error"`);
		}

		return message;
	}

	generateLintResult(resourcePath: ResourcePath): LintResult {
		const rawMessages = this.#rawMessages.get(resourcePath) ?? [];
		const coverageInfo = this.#coverageInfo.get(resourcePath) ?? [];
		let errorCount = 0;
		let warningCount = 0;
		let fatalErrorCount = 0;

		const messages: LintMessage[] = rawMessages.map((rawMessage) => {
			const message = this.#getMessageFromRawMessage(rawMessage);
			if (message.severity === LintMessageSeverity.Error) {
				errorCount++;
				if (message.fatal) {
					fatalErrorCount++;
				}
			} else {
				warningCount++;
			}
			return message;
		});

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
			resourcePaths = new Set([...this.#rawMessages.keys(), ...this.#coverageInfo.keys()]).values();
		} else {
			resourcePaths = this.#rawMessages.keys();
		}

		for (const resourcePath of resourcePaths) {
			lintResults.push(this.generateLintResult(resourcePath));
		}

		return lintResults;
	}
}
