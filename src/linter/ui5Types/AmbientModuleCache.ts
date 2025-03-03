import ts from "typescript";

export class AmbientModuleCache {
	private cache = new Map<string, ts.Symbol | null>();

	constructor(private modules: ts.Symbol[]) {
	}

	private findAndCacheEntry(moduleName: string): ts.Symbol | null {
		for (const module of this.modules) {
			if (!module.valueDeclaration || !ts.isModuleDeclaration(module.valueDeclaration)) {
				continue;
			}
			const found = module.valueDeclaration.name.text === moduleName;
			if (found) {
				this.cache.set(moduleName, module);
				return module;
			}
		}
		// Add negative cache entry
		this.cache.set(moduleName, null);
		return null;
	}

	getModule(moduleName: string): ts.Symbol | null {
		const module = this.cache.get(moduleName);
		if (module !== undefined) {
			return module;
		} else {
			return this.findAndCacheEntry(moduleName);
		}
	}
}
