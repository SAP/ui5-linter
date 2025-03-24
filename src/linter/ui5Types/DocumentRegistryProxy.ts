import ts from "typescript";
import LanguageServiceHostProxy from "./LanguageServiceHostProxy.js";

export default class DocumentRegistryProxy implements ts.DocumentRegistry {
	private readonly documentRegistry = ts.createDocumentRegistry();

	// ts.DocumentRegistry implementation:

	acquireDocument(
		_fileName: string, _compilationSettingsOrHost: ts.CompilerOptions | ts.MinimalResolutionCacheHost,
		_scriptSnapshot: ts.IScriptSnapshot, _version: string, _scriptKind?: ts.ScriptKind,
		_sourceFileOptions?: ts.CreateSourceFileOptions | ts.ScriptTarget
	): ts.SourceFile {
		throw new Error("Method not implemented.");
	}

	acquireDocumentWithKey(
		fileName: string, path: ts.Path, compilationSettingsOrHost: ts.CompilerOptions | ts.MinimalResolutionCacheHost,
		key: ts.DocumentRegistryBucketKey, scriptSnapshot: ts.IScriptSnapshot, version: string,
		scriptKind?: ts.ScriptKind, sourceFileOptions?: ts.CreateSourceFileOptions | ts.ScriptTarget
	): ts.SourceFile {
		return this.documentRegistry.acquireDocumentWithKey(
			fileName, path, compilationSettingsOrHost, key, scriptSnapshot, version, scriptKind, sourceFileOptions
		);
	}

	updateDocument(
		_fileName: string, _compilationSettingsOrHost: ts.CompilerOptions | ts.MinimalResolutionCacheHost,
		_scriptSnapshot: ts.IScriptSnapshot, _version: string, _scriptKind?: ts.ScriptKind,
		_sourceFileOptions?: ts.CreateSourceFileOptions | ts.ScriptTarget
	): ts.SourceFile {
		throw new Error("Method not implemented.");
	}

	updateDocumentWithKey(
		fileName: string, path: ts.Path, compilationSettingsOrHost: ts.CompilerOptions | ts.MinimalResolutionCacheHost,
		key: ts.DocumentRegistryBucketKey, scriptSnapshot: ts.IScriptSnapshot, version: string,
		scriptKind?: ts.ScriptKind, sourceFileOptions?: ts.CreateSourceFileOptions | ts.ScriptTarget
	): ts.SourceFile {
		return this.documentRegistry.updateDocumentWithKey(
			fileName, path, compilationSettingsOrHost, key, scriptSnapshot, version, scriptKind, sourceFileOptions
		);
	}

	getKeyForCompilationSettings(settings: ts.CompilerOptions): ts.DocumentRegistryBucketKey {
		return this.documentRegistry.getKeyForCompilationSettings(settings);
	}

	releaseDocument(
		_fileName: string, _compilationSettings: ts.CompilerOptions, _scriptKind?: ts.ScriptKind
	): void {
		throw new Error("Method not implemented.");
	}

	releaseDocumentWithKey(
		path: ts.Path, key: ts.DocumentRegistryBucketKey, scriptKind?: ts.ScriptKind
	): void;
	releaseDocumentWithKey(
		path: ts.Path, key: ts.DocumentRegistryBucketKey, scriptKind: ts.ScriptKind,
		impliedNodeFormat: ts.ResolutionMode
	): void;
	releaseDocumentWithKey(
		path: ts.Path, key: ts.DocumentRegistryBucketKey, scriptKind?: ts.ScriptKind,
		impliedNodeFormat?: ts.ResolutionMode
	): void {
		if (LanguageServiceHostProxy.isSharedTypesFile(path)) {
			// Do not release documents in /types/ as they are shared across multiple projects
			// and should still be cached even when no longer needed by a specific project.
			return;
		}
		if (scriptKind && impliedNodeFormat) {
			this.documentRegistry.releaseDocumentWithKey(path, key, scriptKind, impliedNodeFormat);
		} else {
			this.documentRegistry.releaseDocumentWithKey(path, key, scriptKind);
		}
	}

	reportStats(): string {
		return this.documentRegistry.reportStats();
	}
}
