import fs from "node:fs";
import path from "node:path";
import posixPath from "node:path/posix";
import ts from "typescript";
import {createRequire} from "node:module";
const require = createRequire(import.meta.url);

interface PackageJson {
	dependencies: Record<string, string>;
}

function addPathMappingForPackage(pkgName: string, pathMapping: Map<string, string>) {
	const pkgDir = path.dirname(require.resolve(`${pkgName}/package.json`));
	pathMapping.set(pkgName, pkgDir);
}

function collectTransitiveDependencies(pkgName: string, deps: Set<string>): Set<string> {
	const pkgJsonPath = require.resolve(`${pkgName}/package.json`);
	const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")) as PackageJson;
	if (pkgJson.dependencies) {
		Object.keys(pkgJson.dependencies).map((depName) => {
			deps.add(depName);
			const depDeps = collectTransitiveDependencies(depName, deps);
			depDeps.forEach((dep) => deps.add(dep));
		});
	}
	return deps;
}

function collectSapui5TypesFiles() {
	const typesDir = path.dirname(require.resolve("@sapui5/types/package.json"));
	const allFiles = fs.readdirSync(path.join(typesDir, "types"), {withFileTypes: true});
	const typesFiles: string[] = [];
	for (const entry of allFiles) {
		if (entry.isFile() && entry.name.endsWith(".d.ts") && entry.name !== "index.d.ts") {
			typesFiles.push(entry.name);
		}
	}
	return typesFiles;
}

export default class Sapui5Types {
	private readonly types: string[] = [];
	private readonly sapui5TypesFiles: string[] = [];

	private typePathMappings = new Map<string, string>();

	constructor() {
		this.types = this.collectTypes();
		this.sapui5TypesFiles = collectSapui5TypesFiles();
	}

	private collectTypes() {
		addPathMappingForPackage("typescript", this.typePathMappings);

		const typePackages = new Set(["@sapui5/types"]);
		collectTransitiveDependencies("@sapui5/types", typePackages);
		typePackages.forEach((pkgName) => {
			addPathMappingForPackage(pkgName, this.typePathMappings);
		});
		const typePackageDirs = Array.from(typePackages.keys()).map((pkgName) => `/types/${pkgName}/`);

		typePackageDirs.push("/types/@ui5/linter/overrides");
		this.typePathMappings.set("@ui5/linter/overrides", path.dirname(
			require.resolve("../../resources/overrides/package.json")
		));

		const dirs = Array.from(this.typePathMappings.values());
		return dirs;

		// // Return all types except @sapui5/types which will be handled dynamically per project
		// return typePackageDirs.filter((dir) => dir !== "/types/@sapui5/types/");
	}

	private addSapui5TypesCompilerOptions(
		paths: ts.MapLike<string[]>,
		types: string[],
		projectNamespace?: string
	) {
		const typesDir = path.dirname(require.resolve("@sapui5/types/package.json"));
		this.sapui5TypesFiles.forEach((fileName) => {
			const dtsPath = path.join(typesDir, "types", fileName);
			const libraryName = posixPath.basename(fileName, ".d.ts");
			const libraryNamespace = libraryName.replace(/\./g, "/");
			if (libraryNamespace === "sap/ui/core" || libraryNamespace === projectNamespace) {
				// Special cases:
				// - sap.ui.core needs to be loaded by default as it provides general API that must always be available
				// - When linting a framework library, the corresponding types should be loaded by default as they
				//   might not get loaded by the compiler otherwise, as the actual sources are available in the project.
				types.push(dtsPath);
			} else {
				// For other framework libraries we can add a paths mapping to load them on demand
				const mappingNamespace = libraryNamespace + "/*";
				const pathsEntry = paths[mappingNamespace] ?? (paths[mappingNamespace] = []);
				pathsEntry.push(dtsPath);
			}
		});
	}

	getFiles() {
		const files = new Map<string, string>();

		return files;
	}

	getCompilerOptions(projectNamespace?: string): ts.CompilerOptions {
		let types: ts.CompilerOptions["types"] = [...this.types];
		const paths: ts.CompilerOptions["paths"] = {};
		if (projectNamespace) {
			paths[`${projectNamespace}/*`] = [
				// Enforce that the compiler also tries to resolve imports with a .js extension.
				// With this mapping, the compiler still first tries to resolve the .ts, .tsx and .d.ts extensions
				// but then falls back to .js
				`/resources/${projectNamespace}/*.js`,
			];
		}

		// This doesn't seem to work
		// this.typePathMappings.forEach((dir, pkgName) => {
		// 	paths[`/types/${pkgName}/*`] = [`${dir}/*`];
		// });

		this.addSapui5TypesCompilerOptions(paths, types, projectNamespace);

		types = types.map((type) => {
			return "/types/" + type;
		});

		return {
			typeRoots: ["/types"],
			types,
			paths,
		};
	}
}
