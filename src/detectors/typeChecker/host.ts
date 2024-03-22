import ts from "typescript";
import path from "node:path";
import posixPath from "node:path/posix";
import fs from "node:fs/promises";
import {createRequire} from "node:module";
const require = createRequire(import.meta.url);

const SAPUI5_TYPES_FILES = [
	"sap.apf",
	"sap.chart",
	"sap.ui.codeeditor",
	"sap.collaboration",
	"sap.zen.crosstab",
	"sap.zen.dsh",
	"sap.zen.commons",
	"sap.sac.df",
	"sap.ui.commons",
	"sap.ui.comp",
	"sap.ui.core",
	"sap.ui.dt",
	"sap.ui.export",
	"sap.f",
	"sap.ui.fl",
	"sap.gantt",
	"sap.ui.generic.app",
	"sap.ui.generic.template",
	"sap.uiext.inbox",
	"sap.insights",
	"sap.ui.integration",
	"sap.ui.layout",
	"sap.makit",
	"sap.ui.mdc",
	"sap.m",
	"sap.me",
	"sap.ndc",
	"sap.ovp",
	"sap.ui.richtexteditor",
	"sap.ui.rta",
	"sap.esh.search.ui",
	"sap.fe.core",
	"sap.fe.macros",
	"sap.fe.navigation",
	"sap.fe.placeholder",
	"sap.fe.templates",
	"sap.fe.test",
	"sap.fe.tools",
	"sap.feedback.ui",
	"sap.rules.ui",
	"sap.suite.ui.generic.template",
	"sap.ui.vk",
	"sap.ui.vtm",
	"sap.webanalytics.core",
	"sap.ui.suite",
	"sap.suite.ui.commons",
	"sap.suite.ui.microchart",
	"sap.ui.support",
	"sap.ui.table",
	"sap.ui.testrecorder",
	"sap.tnt",
	"sap.ca.ui",
	"sap.ui.unified",
	"sap.ushell",
	"sap.ushell_abap",
	"sap.ui.ux3",
	"sap.uxap",
	"sap.ui.vbm",
	"sap.viz",
	"sap.ui.webc.common",
	"sap.ui.webc.fiori",
	"sap.ui.webc.main",
];

interface PackageJson {
	dependencies: Record<string, string>;
}

function notImplemented(methodName: string) {
	throw new Error(`Not implemented: ${methodName}`);
}

function addPathMappingForPackage(pkgName: string, pathMapping: Map<string, string>) {
	const pkgDir = path.dirname(require.resolve(`${pkgName}/package.json`));
	pathMapping.set(pkgName, pkgDir);
}

async function collectTransitiveDependencies(pkgName: string, deps: Set<string>): Promise<Set<string>> {
	const pkgJsonPath = require.resolve(`${pkgName}/package.json`);
	const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf8")) as PackageJson;
	if (pkgJson.dependencies) {
		await Promise.all(Object.keys(pkgJson.dependencies).map(async (depName) => {
			deps.add(depName);
			const depDeps = await collectTransitiveDependencies(depName, deps);
			depDeps.forEach((dep) => deps.add(dep));
		}));
	}
	return deps;
}

export async function createVirtualCompilerHost(
	options: ts.CompilerOptions, files: Map<string, string>
): Promise<ts.CompilerHost> {
	const typePathMappings = new Map<string, string>();
	addPathMappingForPackage("typescript", typePathMappings);

	const typePackages = new Set(["@sapui5/types"]);
	await collectTransitiveDependencies("@sapui5/types", typePackages);
	typePackages.forEach((pkgName) => {
		addPathMappingForPackage(pkgName, typePathMappings);
	});
	const typePackageDirs = Array.from(typePackages.keys()).map((pkgName) => `/types/${pkgName}/`);

	typePackageDirs.push("/types/@ui5/linter/overrides");
	typePathMappings.set("@ui5/linter/overrides", path.dirname(
		require.resolve("../../../resources/overrides/package.json")
	));

	options.typeRoots = ["/types"];
	options.types = [
		// Request compiler to only use sap.ui.core types by default - other types will be loaded on demand
		...typePackageDirs.filter((dir) => dir !== "/types/@sapui5/types/"),
		"/types/@sapui5/types/types/sap.ui.core.d.ts",
	];

	// Create regex matching all path mapping keys
	const pathMappingRegex = new RegExp(
		`^\\/types\\/(${Array.from(typePathMappings.keys()).join("|").replaceAll("/", "\\/")})\\/(.*)`);

	if (!options.rootDir) {
		throw new Error(`Missing option 'rootDir'`);
	}

	function mapToTypePath(fileName: string): string | undefined {
		const pkgName = fileName.match(pathMappingRegex);
		if (pkgName && pkgName.length === 3) {
			const mappedPath = typePathMappings.get(pkgName[1]);
			if (mappedPath) {
				return path.join(mappedPath, pkgName[2]);
			}
		}
	}

	function getFile(fileName: string): string | undefined {
		// NOTE: This function should be kept in sync with "fileExists"

		if (files.has(fileName)) {
			return files.get(fileName);
		}
		if (fileName.startsWith("/types/")) {
			const fsPath = mapToTypePath(fileName);
			if (fsPath) {
				return ts.sys.readFile(fsPath);
			}
		}
		// console.log("Not found " + fileName);
	}

	// Pre-compile list of all directories
	const directories = new Set();
	for (const filePath of files.keys()) {
		// Add every directory of the file path to the set of directories
		let directory = posixPath.dirname(filePath);
		while (directory !== "/" && directory !== ".") {
			directories.add(directory);
			directory = posixPath.dirname(directory);
		}
	}

	for (const typePackageDir of typePackageDirs) {
		// Add every directory of the type package path to the set of directories
		let directory = typePackageDir;
		while (directory !== "/" && directory !== ".") {
			directories.add(directory);
			directory = posixPath.dirname(directory);
		}
	}

	const sourceFileCache = new Map<string, ts.SourceFile>();
	return {
		directoryExists: (directory) => {
			if (directories.has(directory)) {
				return true;
			}
			if (directory.startsWith("/types")) {
				// Check whether any mapped directory path begins with the requested directory
				// Check within mapped paths by rewriting the requested path
				if (!directory.endsWith("/")) {
					// Ensure trailing slash to make sure we only match directories,
					// because compiler sometimes asks for paths like "[...]/controller/Main.controller".
					// Which could match the beginning of a file's path too
					directory += "/";
				}
				const fsPath = mapToTypePath(directory);
				if (fsPath) {
					return ts.sys.directoryExists(fsPath);
				}
				if (directory.startsWith("/types/@ui5/linter/dynamic-types/")) {
					return true;
				}
			}
			return false;
		},
		fileExists: (fileName) => {
			// NOTE: This function should be kept in sync with "getFile"

			if (files.has(fileName)) {
				return true;
			}
			if (fileName.startsWith("/types/")) {
				const fsPath = mapToTypePath(fileName);
				if (fsPath) {
					return ts.sys.fileExists(fsPath);
				}
				if (fileName.startsWith("/types/@ui5/linter/dynamic-types/") && fileName.endsWith(".d.ts")) {
					return true;
				}
			}
			return false;
		},
		getCurrentDirectory: () => options.rootDir ?? "/",
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		getDirectories: (directory: string) => {
			// This function seems to be called only if the "types" option is not set
			// console.log(`getDirectories: ${directory}`);
			return [];
		},
		readDirectory: (
			dirPath: string, extensions?: readonly string[],
			exclude?: readonly string[], include?: readonly string[],
			depth?: number
		): string[] => {
			// This function doesn't seem to be called during normal operations
			// console.log(`readDirectory: ${dirPath}`);
			return Array.from(files.keys()).filter((filePath) => {
				if (include ?? exclude ?? depth ?? extensions) {
					notImplemented("readDirectory: Optional parameters");
				}
				return posixPath.dirname(filePath) === dirPath;
			});
		},
		getSourceFile: (
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void) => {
			// console.log(`getSourceFile ${fileName}`);
			if (sourceFileCache.has(fileName)) {
				return sourceFileCache.get(fileName);
			}

			let sourceText: string | undefined = undefined;

			if (fileName.startsWith("/types/@ui5/linter/dynamic-types/") && fileName.endsWith(".d.ts")) {
				const moduleName = fileName.match(/\/types\/@ui5\/linter\/dynamic-types\/(.*)\.d\.ts/)?.[1];
				if (moduleName) {
					const libraryNameCheck = moduleName?.replace(/\//g, ".");
					if (libraryNameCheck.startsWith("sap.ui.core.") || !libraryNameCheck.startsWith("sap.")) {
						// sap.ui.core is loaded by default
						return;
					}
					const libraryName = SAPUI5_TYPES_FILES.find(($) => libraryNameCheck.startsWith($ + "."));
					if (libraryName) {
						sourceText = `/// <reference path="/types/@sapui5/types/types/${libraryName}.d.ts"/>`;
					} else {
						// Can happen e.g. for sap/ui/base/Event.d.ts, but sap.ui.core.d.ts is loaded by default
						return;
					}
				}
			}

			if (!sourceText) {
				sourceText = getFile(fileName);
			}
			if (sourceText === undefined) {
				throw new Error(`File not found: ${fileName}`);
			}

			const sourceFile = ts.createSourceFile(fileName, sourceText, languageVersion);
			sourceFileCache.set(fileName, sourceFile);
			return sourceFile;
		},
		readFile: (fileName) => {
			// console.log(`readFile ${fileName}`);
			return getFile(fileName);
		},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		writeFile: (fileName, contents) => {
			// We don't expect this function to be called for our use case so far
			notImplemented("write");
			// files.set(fileName, contents);
		},
		getCanonicalFileName: (fileName) => fileName,
		getDefaultLibFileName: (defaultLibOptions: ts.CompilerOptions) => {
			return ts.getDefaultLibFileName(defaultLibOptions);
		},
		getDefaultLibLocation: () => "/types/typescript/lib",
		getNewLine: () => "\n",
		useCaseSensitiveFileNames: () => true,
	};
}
