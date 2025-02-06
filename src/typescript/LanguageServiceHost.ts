import ts from "typescript";
import {FileContents} from "../linter/ui5Types/host.js";
import LinterContext from "../linter/LinterContext.js";

interface Script {
	snapshot: ts.IScriptSnapshot;
	version: number;
	isProjectScript: boolean;
}

export default class LanguageServiceHost implements ts.LanguageServiceHost {
	private scripts: ts.MapLike<Script> = {};

	constructor(private readonly compilerOptions: ts.CompilerOptions) {
	}

	// Custom methods:

	setProjectInfo(files: FileContents, _sourceMaps: Map<string, string>, _context: LinterContext) {
		for (const [fileName, content] of files) {
			this.scripts[fileName] = {
				snapshot: ts.ScriptSnapshot.fromString(
					typeof content === "function" ? content() : content
				),
				version: 0,
				isProjectScript: true,
			};
		}
	}

	removeProjectInfo() {
		for (const fileName in this.scripts) {
			if (this.scripts[fileName].isProjectScript) {
				delete this.scripts[fileName];
			}
		}
	}

	// ts.LanguageServiceHost implementation:

	getCompilationSettings() {
		return this.compilerOptions;
	}

	getScriptFileNames() {
		return Object.keys(this.scripts);
	}

	getScriptVersion(fileName: string) {
		return this.scripts[fileName]?.version.toString() ?? "-1";
	}

	getScriptSnapshot(fileName: string) {
		return this.scripts[fileName]?.snapshot;
	}

	getDefaultLibFileName(_options: ts.CompilerOptions) {
		return "FIXME";
	}

	getCurrentDirectory() {
		return "";
	}

	fileExists(filePath: string) {
		return !!this.scripts[filePath];
	}

	readFile(filePath: string) {
		const script = this.scripts[filePath];
		if (script) {
			return script.snapshot.getText(0, script.snapshot.getLength());
		}
	}
}
