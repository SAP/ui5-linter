// Multiple views/fragments can use the same ID and link to the same controller,
// so we need to store a set of module names for each ID.
export type IdModulesMap = Map<string, Set<string>>;

type ControllerElementsMap = Map<string, IdModulesMap>;

export default class ControllerByIdInfo {
	private map: ControllerElementsMap = new Map();

	private getControllerMapping(controllerName: string) {
		let controllerMap = this.map.get(controllerName);
		if (!controllerMap) {
			controllerMap = new Map();
			this.map.set(controllerName, controllerMap);
		}
		return controllerMap;
	}

	public addMappings(controllerName: string, idModuleMap: Map<string, string>) {
		const controllerMapping = this.getControllerMapping(controllerName);
		for (const [id, module] of idModuleMap) {
			let existingModules = controllerMapping.get(id);
			if (!existingModules) {
				existingModules = new Set();
				controllerMapping.set(id, existingModules);
			}
			existingModules.add(module);
		}
	}

	public getMappings() {
		return this.map;
	}
}
