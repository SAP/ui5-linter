import ts from "typescript";
import ChangeGroup from "./ChangeGroup.js";
import {ModuleDeclaration} from "../amdTranspiler/parseModuleDeclaration.js";
import {RequireExpression} from "../amdTranspiler/parseRequire.js";
import {Dependencies} from "../../../autofix/solutions/amdImports.js";

// export type ModuleName = string;
// export interface ModuleImport {
// 	identifier?: string;
// 	preferredIdentifier?: string;
// 	requestingSolutions: Set<ChangeGroup>;
// }

interface PositionedModuleDeclaration {
	start: number;
	end: number;
	moduleDeclaration: ModuleDeclaration | RequireExpression;
	importedModules: Dependencies;
	node: ts.CallExpression;
}

export default class ChangeCollection {
	// private moduleImportRequests: ModuleImportRequest[] = [];
	private changeGroups: ChangeGroup[] = [];
	private moduleDeclarations: PositionedModuleDeclaration[] = [];

	createChangeManager() {
		const changeGroup = new ChangeGroup();
		this.changeGroups.push(changeGroup);
		return changeGroup;
	}

	addModuleDeclaration(node: ts.CallExpression,
		moduleDeclaration: ModuleDeclaration | RequireExpression, importedModules: Dependencies) {
		this.moduleDeclarations.push({
			start: node.getStart(),
			end: node.getEnd(),
			moduleDeclaration,
			importedModules,
			node,
		});
	}

	satisfyImportRequests() {
		// Go through all import requests and check whether they are already satisfied
		// by any existing module declaration
		// If not, draft a new import at the closed module declaration
		// Once this is done for all import requests, check whether any overlap and try to combine them

		// const existingImports = new Map<string, ModuleImport>();
		// Sort in reverse order to start with closest module declarations
		const sortedDeclarations = this.moduleDeclarations.sort((a, b) => b.start - a.start);

		const existingImportMatches = new Map<ModuleImportRequest, PositionedModuleDeclaration>();
		const potentialMatches = new Map<ModuleImportRequest, PositionedModuleDeclaration>();

		for (const changeGroup of this.changeGroups) {
			for (const request of changeGroup.getModuleImportRequests()) {
				for (const moduleDeclaration of sortedDeclarations) {
					const {start, end, importedModules} = moduleDeclaration;
					if (request.position >= start && request.position <= end) {
						// We have a match, check whether the module name is already imported
						if (importedModules.has(request.moduleName)) {
							// Already imported
							potentialMatches.set(request, moduleDeclaration);
							continue;
						}
						// Add the import request to the module declaration
						moduleDeclaration.factory.addImport(request.preferredIdentifier);
					}
				}
			}
		}


		// TODO: For now just add all imports to the first define
		const {node, moduleDeclaration} = this.moduleDeclarations.values().next();

		
	}
}
