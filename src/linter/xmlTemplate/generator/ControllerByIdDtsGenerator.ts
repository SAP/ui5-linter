import ControllerByIdInfo, {IdModulesMap} from "../ControllerByIdInfo.js";

export class ControllerByIdDtsGenerator {
	// Maps module names to local names
	private imports = new Map<string, string>();

	generate(controllerByIdInfo: ControllerByIdInfo) {
		const mappings = controllerByIdInfo.getMappings();
		if (!mappings.size) {
			return null;
		}
		this.imports = new Map<string, string>();
		this.addImport("sap/ui/core/mvc/View"); // View is needed for interface ControllerView
		this.addImport("sap/ui/core/Element"); // Element is needed for byId fallback signature
		let out = "";
		mappings.forEach((idToModules, controllerName) => {
			out += this.generateModuleDeclaration(controllerName, idToModules);
		});
		return this.generateCollectedImports() + out;
	}

	private generateCollectedImports() {
		return Array.from(this.imports.entries())
			.map(([moduleName, localName]) => `import ${localName} from "${moduleName}";`)
			.join("\n") + "\n";
	}

	private generateByIdMapping(idToModules: IdModulesMap) {
		let out = "interface ByIdMapping {\n";
		idToModules.forEach((modules, id) => {
			const localNames = Array.from(modules).map((moduleName: string) => this.addImport(moduleName));
			out += `\t\t"${id}": ${localNames.join(" | ")};\n`;
		});
		out += "\t}";
		return out;
	}

	private generateModuleDeclaration(controllerName: string, idToModules: IdModulesMap) {
		const moduleName = controllerName.replace(/\./g, "/") + ".controller";

		return `
declare module "${moduleName}" {
	${this.generateByIdMapping(idToModules)}
	type ByIdFunction = {
		<T extends keyof ByIdMapping>(sId: T): ByIdMapping[T];
		(sId: string): ${this.imports.get("sap/ui/core/Element")};
	}
	interface ControllerView extends ${this.imports.get("sap/ui/core/mvc/View")} {
		byId: ByIdFunction;
	}
	export default interface Controller {
		byId: ByIdFunction;
		getView(): ControllerView;
	}
}
`;
	}

	private addImport(moduleName: string) {
		const localName = this.getLocalModuleName(moduleName);
		if (!this.imports.has(moduleName)) {
			this.imports.set(moduleName, localName);
		}
		return localName;
	}

	private getLocalModuleName(moduleName: string) {
		return moduleName.replace(/[/.]/g, "_");
	}
}
