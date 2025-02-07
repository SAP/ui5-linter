import ts from "typescript";

export default class LanguageServiceHostProxy implements ts.LanguageServiceHost {
	private readonly emptyLanguageServiceHost: ts.LanguageServiceHost;
	private languageServiceHost: ts.LanguageServiceHost;

	constructor() {
		this.emptyLanguageServiceHost = this.languageServiceHost = new EmptyLanguageServiceHost();
	}

	setHost(languageServiceHostImpl: ts.LanguageServiceHost | null) {
		this.languageServiceHost = languageServiceHostImpl ?? this.emptyLanguageServiceHost;
	}

	// ts.LanguageServiceHost implementation:

	getCompilationSettings() {
		return this.languageServiceHost.getCompilationSettings();
	}

	getScriptFileNames() {
		return this.languageServiceHost.getScriptFileNames();
	}

	getScriptVersion(fileName: string) {
		return this.languageServiceHost.getScriptVersion(fileName);
	}

	getScriptSnapshot(fileName: string) {
		return this.languageServiceHost.getScriptSnapshot(fileName);
	}

	fileExists(filePath: string) {
		return this.languageServiceHost.fileExists(filePath);
	}

	readFile(filePath: string) {
		return this.languageServiceHost.readFile(filePath);
	}

	getDefaultLibFileName(options: ts.CompilerOptions) {
		return this.languageServiceHost.getDefaultLibFileName(options);
	}

	getCurrentDirectory() {
		return this.languageServiceHost.getCurrentDirectory();
	}
}

export class EmptyLanguageServiceHost implements ts.LanguageServiceHost {
	getCompilationSettings() {
		return {};
	}

	getScriptFileNames() {
		return [];
	}

	getScriptVersion() {
		return "0";
	}

	getScriptSnapshot() {
		return undefined;
	}

	fileExists() {
		return false;
	}

	readFile() {
		return undefined;
	}

	getCurrentDirectory() {
		return "/";
	}

	getDefaultLibFileName(options: ts.CompilerOptions) {
		return ts.getDefaultLibFileName(options);
	}
}
