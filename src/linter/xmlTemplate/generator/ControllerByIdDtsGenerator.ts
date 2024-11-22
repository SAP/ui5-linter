import ControllerByIdInfo, {IdModulesMap} from "../ControllerByIdInfo.js";

interface Import {
	localName: string;
	moduleName: string;
}
export class ControllerByIdDtsGenerator {
	private imports = new Set<Import>();

	constructor(private controllerByIdInfo: ControllerByIdInfo) {
	}

	generate() {
		let out = "";
		this.controllerByIdInfo.getMappings().forEach((idToModules, controllerName) => {
			out += this.generateModuleDeclaration(controllerName, idToModules);
		});
		return this.generateCollectedImports() + out;
	}

	generateCollectedImports() {
		let out = "";
		this.imports.forEach((moduleImport) => {
			out += `import ${moduleImport.localName} from "${moduleImport.moduleName}";\n`;
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
				this.imports.add({localName, moduleName});
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
