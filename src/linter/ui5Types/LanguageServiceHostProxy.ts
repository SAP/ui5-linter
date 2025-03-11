import ts from "typescript";
import {CONTROLLER_BY_ID_DTS_PATH} from "../xmlTemplate/linter.js";

export default class LanguageServiceHostProxy implements ts.LanguageServiceHost {
	private readonly emptyLanguageServiceHost: ts.LanguageServiceHost;
	private languageServiceHost: ts.LanguageServiceHost;
	private scriptSnapshots: ts.MapLike<ts.IScriptSnapshot | undefined> = {};
	private sharedTypesFileExistsCache = new Map<string, boolean>();

	constructor() {
		this.emptyLanguageServiceHost = this.languageServiceHost = new EmptyLanguageServiceHost();
	}

	setHost(languageServiceHostImpl: ts.LanguageServiceHost | null) {
		this.languageServiceHost = languageServiceHostImpl ?? this.emptyLanguageServiceHost;
	}

	private isSharedTypesFile(filePath: string) {
		// ControllerById.d.ts file is generated per project and should not be treated as a shared file
		return filePath.startsWith("/types/") && filePath !== CONTROLLER_BY_ID_DTS_PATH;
	}

	// ts.LanguageServiceHost implementation:

	getCompilationSettings() {
		return this.languageServiceHost.getCompilationSettings();
	}

	getScriptFileNames() {
		return this.languageServiceHost.getScriptFileNames();
	}

	getScriptVersion(fileName: string) {
		if (this.isSharedTypesFile(fileName)) {
			// All types should be cached forever as they can be shared across projects
			return "1";
		}
		return this.languageServiceHost.getScriptVersion(fileName);
	}

	getScriptSnapshot(fileName: string) {
		if (this.scriptSnapshots[fileName]) {
			return this.scriptSnapshots[fileName];
		}
		const scriptSnapshot = this.languageServiceHost.getScriptSnapshot(fileName);
		if (this.isSharedTypesFile(fileName)) {
			this.scriptSnapshots[fileName] = scriptSnapshot;
		}
		return scriptSnapshot;
	}

	fileExists(filePath: string) {
		if (this.isSharedTypesFile(filePath)) {
			let fileExists = this.sharedTypesFileExistsCache.get(filePath);
			if (fileExists === undefined) {
				fileExists = this.languageServiceHost.fileExists(filePath);
				this.sharedTypesFileExistsCache.set(filePath, fileExists);
			}
			return fileExists;
		}
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
