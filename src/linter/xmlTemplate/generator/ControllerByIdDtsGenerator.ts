import ControllerByIdInfo, {IdModulesMap} from "../ControllerByIdInfo.js";

export class ControllerByIdDtsGenerator {
	// Maps module names to local names
	private imports = new Map<string, string>();

	constructor(private controllerByIdInfo: ControllerByIdInfo) {
	}

	generate() {
		const mappings = this.controllerByIdInfo.getMappings();
		if (mappings.size === 0) {
			return null;
		}
		let out = "";
		mappings.forEach((idToModules, controllerName) => {
			out += this.generateModuleDeclaration(controllerName, idToModules);
		});
		return this.generateCollectedImports() + out;
	}

	generateCollectedImports() {
		let out = "";
		this.imports.forEach((localName, moduleName) => {
			out += `import ${localName} from "${moduleName}";\n`;
		});
		out += "\n";
		return out;
	}

	generateByIdMapping(idToModules: IdModulesMap) {
		let out = "\tinterface ByIdMapping {\n";
		idToModules.forEach((modules, id) => {
			const localNames: string[] = [];
			modules.forEach((moduleName) => {
				const localName = this.getLocalModuleName(moduleName);
				localNames.push(localName);
				if (!this.imports.has(moduleName)) {
					this.imports.set(moduleName, localName);
				}
			});
			out += `\t\t"${id}": ${localNames.join(" | ")};\n`;
		});
		out += "\t}\n";
		return out;
	}

	generateModuleDeclaration(controllerName: string, idToModules: IdModulesMap) {
		const moduleName = controllerName.replace(/\./g, "/") + ".controller";
		// The interface name actually does not really matter as the declaration refers to the default export
		const controllerClassName = controllerName.split(".").pop();
		let out = `declare module "${moduleName}" {\n`;
		out += this.generateByIdMapping(idToModules);
		out += `\texport default interface ${controllerClassName} {\n`;
		out += `\t\tbyId<T extends keyof ByIdMapping>(sId: T): ByIdMapping[T];\n`;
		out += `\t\tbyId(sId: string): UI5Element;\n`;
		out += `\t};\n`;
		out += `};\n\n`;
		return out;
	}

	getLocalModuleName(moduleName: string) {
		return moduleName.replace(/[/.]/g, "_");
	}
}
