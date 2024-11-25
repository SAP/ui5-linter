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
		let out = "";
		this.imports.forEach((localName, moduleName) => {
			out += `import ${localName} from "${moduleName}";\n`;
		});
		out += "\n";
		return out;
	}

	private generateByIdMapping(idToModules: IdModulesMap) {
		let out = "\tinterface ByIdMapping {\n";
		idToModules.forEach((modules, id) => {
			const localNames: string[] = [];
			modules.forEach((moduleName) => localNames.push(this.addImport(moduleName)));
			out += `\t\t"${id}": ${localNames.join(" | ")};\n`;
		});
		out += "\t}\n";
		return out;
	}

	private generateModuleDeclaration(controllerName: string, idToModules: IdModulesMap) {
		const moduleName = controllerName.replace(/\./g, "/") + ".controller";

		let out = `declare module "${moduleName}" {\n`;
		out += this.generateByIdMapping(idToModules);
		out += `\ttype ByIdFunction = {\n`;
		out += `\t\t<T extends keyof ByIdMapping>(sId: T): ByIdMapping[T];\n`;
		out += `\t\t(sId: string): sap_ui_core_Element;\n`; // Fallback signature for unknown IDs
		out += `\t};\n`;
		out += `\tinterface ControllerView extends sap_ui_core_mvc_View {\n`;
		out += `\t\tbyId: ByIdFunction;\n`;
		out += `\t};\n`;
		// The interface name does not matter as the declaration refers to the default export.
		// To avoid name clashes we are just using "Controller" here.
		out += `\texport default interface Controller {\n`;
		out += `\t\tbyId: ByIdFunction;\n`;
		out += `\t\tgetView(): ControllerView;\n`;
		out += `\t};\n`;
		out += `};\n\n`;
		return out;
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
