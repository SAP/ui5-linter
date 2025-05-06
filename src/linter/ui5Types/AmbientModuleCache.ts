import ts from "typescript";
import {isSourceFileOfPseudoModuleType, isSourceFileOfTypeScriptLib} from "./utils/utils.js";

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

	findModuleForName(moduleName: string): ts.Symbol | undefined {
		const moduleSymbol = this.getModule(moduleName);

		if (!moduleSymbol) {
			return;
		}
		const declarations = moduleSymbol.getDeclarations();
		if (!declarations) {
			throw new Error(`Could not find declarations for module: ${moduleName}`);
		}
		for (const decl of declarations) {
			const sourceFile = decl.getSourceFile();
			if (isSourceFileOfTypeScriptLib(sourceFile)) {
				// Ignore any non-UI5 symbols
				return;
			}
			if (isSourceFileOfPseudoModuleType(sourceFile)) {
				// Ignore pseudo modules, we rather find them via probing for the library module
				return;
			}
		}
		return moduleSymbol;
	}
}
