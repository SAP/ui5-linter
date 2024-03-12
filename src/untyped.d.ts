declare module "@ui5/to-esm" {
	interface Result {
		source: string;
		map: string;
	}
	export default function ui5ToESM(content: string, options: object): Result;
}

declare module "@ui5/project" {
	import {AbstractReader} from "@ui5/fs";

	type ProjectNamespace = string;
	interface Project {
		getNamespace: () => ProjectNamespace;
		getReader: (options: ReaderOptions) => AbstractReader;
		getRootPath: () => string;
	}
	interface ProjectGraph {
		getRoot: () => Project;
	}
	interface DependencyTreeNode {
		id: string;
		version: string;
		path: string;
		configuration?: object | object[];
		configPath?: string;
		dependencies: DependencyTreeNode[];
	}
}

declare module "@ui5/project/ui5Framework/maven/CacheMode" {
	enum CacheMode {
		Default = "Default",
		Force = "Force",
		Off = "Off",
	}
	export default CacheMode;
}

declare module "@ui5/project/graph" {
	import type CacheMode from "@ui5/project/ui5Framework/maven/CacheMode";

	interface GraphFromObjectOptions {
		dependencyTree: DependencyTreeNode;
		cwd?: string;
		rootConfiguration?: object;
		rootConfigPath?: string;
		versionOverride?: string;
		cacheMode?: CacheMode;
		resolveFrameworkDependencies?: boolean;
	}
	export function graphFromObject(options: GraphFromObjectOptions): Promise<ProjectGraph>;

	interface GraphFromPackageDependenciesOptions {
		cwd?: string;
		rootConfiguration?: object;
		rootConfigPath?: string;
		versionOverride?: string;
		cacheMode?: CacheMode;
		resolveFrameworkDependencies?: boolean;
		workspaceName?: string;
		workspaceConfiguration?: object;
		workspaceConfigPath?: string;
	}
	export function graphFromPackageDependencies(options?: GraphFromPackageDependenciesOptions): Promise<ProjectGraph>;
}

declare module "@ui5/fs" {
	type ResourcePath = string;
	interface ResourceSourceMetadata {
		fsPath: string;
	}
	interface Resource {
		getBuffer: () => Promise<Buffer>;
		getString: () => Promise<string>;
		getStream: () => stream.Readable;
		getName: () => string;
		getPath: () => ResourcePath;
		getProject: () => Project;
		getSourceMetadata: () => ResourceSourceMetadata;
	}
	enum ReaderStyles {
		buildtime = "buildtime",
		dist = "dist",
		runtime = "runtime",
		flat = "flat",
	}
	interface ReaderOptions {
		style: ReaderStyles;
	}
	interface GlobOptions {
		nodir?: boolean;
	}
	interface AbstractReader {
		byGlob: (virPattern: string | string[], options?: GlobOptions) => Promise<Resource[]>;
	}
	interface AbstractAdapter extends AbstractReader {

	}
}
declare module "@ui5/fs/resourceFactory" {
	export function createAdapter({fsBasePath: string, virBasePath: string}): AbstractAdapter;
	export function createResource({path: string, string: string}): Resource;
}

declare module "@ui5/logger" {
	interface Logger {
		silly: (message: string) => void;
		verbose: (message: string) => void;
		perf: (message: string) => void;
		info: (message: string) => void;
		warn: (message: string) => void;
		error: (message: string) => void;
		isLevelEnabled: (level: string) => boolean;
	}

	export function isLogLevelEnabled(logLevel: string): boolean;
	export function setLogLevel(logLevel: string): void;
	export function getLogLevel(logLevel: string): string;
	export function getLogger(moduleName: string): Logger;
}

declare module "@ui5/logger/writers/Console" {
	export function stop(): void;
	export function init(): void;
}

// There are no TS Types for json-source-map
declare module "json-source-map";
