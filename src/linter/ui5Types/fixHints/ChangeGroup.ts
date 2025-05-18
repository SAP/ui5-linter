import {ChangeSet} from "../../../autofix/autofix.js";

export default class ChangeGroup {
	private changeSet: ChangeSet[] = [];
	private moduleImportRequests: ModuleImportRequest[] = [];

	getModuleImportRequests() {
		return this.moduleImportRequests;
	}

	addChange(changeSet: ChangeSet) {
		this.changeSet.push(changeSet);
	}

	getIdentifierForImport(moduleName: string) {
		const moduleImport = this.moduleImportRequests.get(moduleName);
		if (!moduleImport) {
			throw new Error(`Module ${moduleName} not found in import requests`);
		}
		if (!moduleImport.identifier) {
			throw new Error(`Module ${moduleName} does not have an identifier`);
		}
		return moduleImport.identifier;
	}
}
