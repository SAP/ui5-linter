import ts from "typescript";

enum ScriptLifecycle {
	Global,
	Project,
}

export interface Script {
	snapshot?: ts.IScriptSnapshot;
	lifecycle: ScriptLifecycle;
	version: number;
}

export default class ScriptCollection {
	private scripts: ts.MapLike<Script | undefined> = {};

	addScript(fileName: string, content: string) {
		this._addScript(fileName, content, ScriptLifecycle.Project);
	}

	addGlobalScript(fileName: string, content: string) {
		this._addScript(fileName, content, ScriptLifecycle.Global);
	}

	private _addScript(fileName: string, content: string, lifecycle: ScriptLifecycle) {
		let script = this.scripts[fileName];
		if (!script) {
			script = this.scripts[fileName] = {
				lifecycle,
				version: 0,
			};
		} else {
			script.lifecycle = lifecycle;
		}
		script.snapshot = ts.ScriptSnapshot.fromString(content);
	}

	removeProjectScripts() {
		for (const fileName in this.scripts) {
			const script = this.scripts[fileName];
			if (script?.lifecycle === ScriptLifecycle.Project) {
				script.snapshot = undefined;
			}
		}
	}

	getScriptFileNames() {
		return Object.keys(this.scripts);
	}

	getScriptVersion(fileName: string) {
		const script = this.scripts[fileName];
		return script?.version.toString() ?? "-1";
	}

	getScriptSnapshot(fileName: string) {
		const script = this.scripts[fileName];
		return script?.snapshot;
	}

	fileExists(filePath: string) {
		return !!this.scripts[filePath];
	}

	readFile(filePath: string) {
		const script = this.scripts[filePath];
		if (script?.snapshot) {
			return script.snapshot.getText(0, script.snapshot.getLength());
		}
	}
}
