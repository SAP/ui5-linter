import ts from "typescript";
import path from "node:path";
import posixPath from "node:path/posix";
import fs from "node:fs/promises";
import {createRequire} from "node:module";
import transpileAmdToEsm from "./amdTranspiler/transpiler.js";
import LinterContext, {ResourcePath} from "../LinterContext.js";
import {getLogger} from "@ui5/logger";
const log = getLogger("linter:ui5Types:host");
const require = createRequire(import.meta.url);

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

async function collectSapui5TypesFiles() {
	const typesDir = path.dirname(require.resolve("@sapui5/types/package.json"));
	const allFiles = await fs.readdir(path.join(typesDir, "types"), {withFileTypes: true});
	const typesFiles = [];
	for (const entry of allFiles) {
		if (entry.isFile() && entry.name.endsWith(".d.ts") && entry.name !== "index.d.ts") {
			typesFiles.push(entry.name);
		}
	}
	return typesFiles;
}

function addSapui5TypesMappingToCompilerOptions(
	sapui5TypesFiles: string[], options: ts.CompilerOptions, projectNamespace?: string
) {
	const paths = options.paths ?? (options.paths = {});
	sapui5TypesFiles.forEach((fileName) => {
		const dtsPath = `/types/@sapui5/types/types/${fileName}`;
		const libraryName = posixPath.basename(fileName, ".d.ts");
		const libraryNamespace = libraryName.replace(/\./g, "/");
		if (libraryNamespace === "sap/ui/core" || libraryNamespace === projectNamespace) {
			// Special cases:
			// - sap.ui.core needs to be loaded by default as it provides general API that must always be available
			// - When linting a framework library, the corresponding types should be loaded by default as they
			//   might not get loaded by the compiler otherwise, as the actual sources are available in the project.
			options.types?.push(dtsPath);
		} else {
			// For other framework libraries we can add a paths mapping to load them on demand
			const mappingNamespace = libraryNamespace + "/*";
			const pathsEntry = paths[mappingNamespace] ?? (paths[mappingNamespace] = []);
			pathsEntry.push(dtsPath);
		}
	});
}

export type FileContents = Map<ResourcePath, string | (() => string)>;

export async function createVirtualLanguageServiceHost(
	options: ts.CompilerOptions,
	files: FileContents, sourceMaps: FileContents,
	context: LinterContext,
	projectScriptVersion: string
): Promise<ts.LanguageServiceHost> {
	const silly = log.isLevelEnabled("silly");

	options.typeRoots = ["/types"];
	options.types = [];

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

	// Add all types except @sapui5/types which will be handled below
	options.types.push(...typePackageDirs.filter((dir) => dir !== "/types/@sapui5/types/"));

	// Adds types / mappings for all @sapui5/types
	addSapui5TypesMappingToCompilerOptions(await collectSapui5TypesFiles(), options, context.getNamespace());

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

	function getFile(resourcePath: string): string | undefined {
		// NOTE: This function should be kept in sync with "fileExists"

		if (files.has(resourcePath)) {
			let fileContent = files.get(resourcePath);
			if (typeof fileContent === "function") {
				fileContent = fileContent();
			}
			if (fileContent && resourcePath.endsWith(".js") && !sourceMaps.get(resourcePath)) {
				// No source map indicates no transpilation was done yet
				const res = transpileAmdToEsm(resourcePath, fileContent, context);
				files.set(resourcePath, res.source);
				sourceMaps.set(resourcePath, res.map);
				fileContent = res.source;
			}
			return fileContent;
		}
		if (resourcePath.startsWith("/types/")) {
			const fsPath = mapToTypePath(resourcePath);
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

	if (silly) {
		log.silly(`compilerOptions: ${JSON.stringify(options, null, 2)}`);
	}

	return {

		getCompilationSettings: () => {
			return options;
		},

		getScriptFileNames: () => {
			if (silly) {
				log.silly(`getScriptFileNames`);
			}
			return Array.from(files.keys());
		},

		getScriptVersion: (fileName) => {
			if (silly) {
				log.silly(`getScriptVersion: ${fileName}`);
			}
			if (fileName.startsWith("/types/")) {
				// All types should be cached forever as they can be shared across projects
				return "0";
			}
			// Currently we don't use incremental compilation within a project, so
			// updating the script version is not necessary.
			// However, as the language service is shared across multiple projects, we need
			// to provide a version that is unique for each project to avoid impacting other
			// projects that might use the same file path.
			return projectScriptVersion;
		},

		getScriptSnapshot: (fileName) => {
			if (silly) {
				log.silly(`getScriptSnapshot: ${fileName}`);
			}
			const fileContent = getFile(fileName);
			if (typeof fileContent === "string") {
				return ts.ScriptSnapshot.fromString(fileContent);
			}
			return undefined;
		},

		directoryExists: (directory) => {
			if (silly) {
				log.silly(`directoryExists: ${directory}`);
			}

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
			}
			return false;
		},
		fileExists: (fileName) => {
			// NOTE: This function should be kept in sync with "getFile"
			if (silly) {
				log.silly(`fileExists: ${fileName}`);
			}

			if (files.has(fileName)) {
				return true;
			}
			if (fileName.startsWith("/types/")) {
				const fsPath = mapToTypePath(fileName);
				if (fsPath) {
					return ts.sys.fileExists(fsPath);
				}
			}
			return false;
		},
		getCurrentDirectory: () => {
			if (silly) {
				log.silly(`getCurrentDirectory`);
			}
			return options.rootDir ?? "/";
		},

		getDirectories: (directory: string) => {
			// This function seems to be called only if the "types" option is not set
			if (silly) {
				log.silly(`getDirectories: ${directory}`);
			}
			return [];
		},
		readDirectory: (
			dirPath: string, extensions?: readonly string[],
			exclude?: readonly string[], include?: readonly string[],
			depth?: number
		): string[] => {
			if (silly) {
				log.silly(`readDirectory: ${dirPath}`);
			}

			// This function doesn't seem to be called during normal operations
			return Array.from(files.keys()).filter((filePath) => {
				if (include ?? exclude ?? depth ?? extensions) {
					notImplemented("readDirectory: Optional parameters");
				}
				return posixPath.dirname(filePath) === dirPath;
			});
		},
		readFile: (fileName) => {
			if (silly) {
				log.silly(`readFile: ${fileName}`);
			}
			return getFile(fileName);
		},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		writeFile: (fileName, contents) => {
			// We don't expect this function to be called for our use case so far
			notImplemented("write");
			// files.set(fileName, contents);
		},
		getDefaultLibFileName: (defaultLibOptions: ts.CompilerOptions) => {
			const defaultLibFileName = ts.getDefaultLibFileName(defaultLibOptions);
			return "/types/typescript/lib/" + defaultLibFileName;
		},
		getNewLine: () => "\n",
		useCaseSensitiveFileNames: () => true,
	};
}
