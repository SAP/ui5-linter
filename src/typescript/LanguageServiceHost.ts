import ts from "typescript";
import ScriptCollection from "./ScriptCollection.js";

export default class LanguageServiceHost implements ts.LanguageServiceHost {
	constructor(
		private readonly compilerOptions: ts.CompilerOptions,
		private readonly scriptCollection: ScriptCollection
	) {
	}

	// Custom methods:

	setCompilerOptions(options: ts.CompilerOptions) {
		Object.assign(this.compilerOptions, options);
	}

	// ts.LanguageServiceHost implementation:

	getCompilationSettings() {
		return this.compilerOptions;
	}

	getScriptFileNames() {
		return this.scriptCollection.getScriptFileNames();
	}

	getScriptVersion(fileName: string) {
		const version = this.scriptCollection.getScriptVersion(fileName);
		if (version) {
			return version;
		}
		return "0";
	}

	getScriptSnapshot(fileName: string) {
		const snapshot = this.scriptCollection.getScriptSnapshot(fileName);
		if (snapshot) {
			return snapshot;
		}
		return ts.ScriptSnapshot.fromString(ts.sys.readFile(fileName) ?? "");
	}

	fileExists(filePath: string) {
		const exists = this.scriptCollection.fileExists(filePath);
		if (exists) {
			return true;
		}
		if (filePath.startsWith("/types/")) {
			return ts.sys.fileExists(filePath);
		}
		return false;
	}

	readFile(filePath: string) {
		return this.scriptCollection.readFile(filePath);
	}

	getDefaultLibFileName(_options: ts.CompilerOptions) {
		return "";
	}

	getCurrentDirectory() {
		return "";
	}
}
