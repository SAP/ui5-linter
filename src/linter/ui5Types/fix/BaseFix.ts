import ts from "typescript";
import {PositionInfo} from "../../LinterContext.js";
import Fix, {GlobalAccessRequest, ModuleDependencyRequest} from "./Fix.js";

export interface BaseFixParams {
	/**
	 * Name of the module to import for use in the fix
	 */
	moduleName?: string;

	/**
	 * The preferred identifier to use for the module import.
	 * If not provided, the identifier will be derived from the module name
	 */
	preferredIdentifier?: string;

	/**
	 * Name of a global variable to use in the fix (e.g. "document")
	 *
	 * The fix will be provided with the identifier name or property access to use via
	 * the setIdentifierForGlobal method.
	 *
	 * For example, if there is already a conflicting identifier within the same file,
	 * the fix will be provided with an alternative like "globalThis.document"
	 */
	globalName?: string;

	/**
	 * Property access on the module or global
	 *
	 * Example: Migrating "module.property" to "otherModule.otherProperty"
	 * would require this to be set to "otherProperty"
	 */
	propertyAccess?: string;
}

export enum FixScope {
	/**
	 * Replace the whole expression
	 *
	 * Call expression example: "sap.module.method()" for a call expression
	 * Access expression example: "sap.module.property"
	 */
	FullExpression = 0,
	/**
	 * Replace the first child of the expression
	 *
	 * Call expression example: "sap.module.method"
	 * Access expression example: "sap.module"
	 */
	FirstChild = 1,
	/**
	 * Replace the second child of the expression
	 *
	 * Call expression example: "sap.module"
	 * Access expression example: "sap"
	 */
	SecondChild = 2,
	/**
	 * Replace the third child of the expression
	 *
	 * Call expression example: "sap"
	 */
	ThirdChild = 3,
	/**
	 * Replace the fourth child of the expression
	 */
	FourthChild = 4,
}

export default abstract class BaseFix extends Fix {
	protected startPos: number | undefined;
	protected endPos: number | undefined;
	protected moduleIdentifierNames: Map<string, string> | undefined;
	protected globalIdentifierNames: Map<string, string> | undefined;
	protected sourcePosition: PositionInfo | undefined;
	protected nodeTypes: ts.SyntaxKind[] = [];
	protected requestsModuleOrGlobal: boolean;

	constructor(protected params: BaseFixParams) {
		super();
		this.requestsModuleOrGlobal = !!(params.globalName ?? params.moduleName);
	}

	getAffectedSourceCodeRange() {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start or end position is not defined");
		}
		return {
			start: this.startPos,
			end: this.endPos,
		};
	}

	getNodeSearchParameters() {
		if (this.sourcePosition === undefined) {
			throw new Error("Position for search is not defined");
		}
		if (this.nodeTypes === undefined) {
			throw new Error("Node types for search are not defined in subclass");
		}
		return {
			nodeTypes: this.nodeTypes,
			position: this.sourcePosition,
		};
	}

	setIdentifierForDependency(identifier: string, moduleName: string) {
		this.moduleIdentifierNames ??= new Map();
		this.moduleIdentifierNames.set(moduleName, identifier);
	}

	setIdentifierForGlobal(identifier: string, globalName: string) {
		this.globalIdentifierNames ??= new Map();
		this.globalIdentifierNames.set(globalName, identifier);
	}

	protected getIdentifiersForSingleRequest(
		moduleName: string | undefined, globalName: string | undefined
	): string | undefined {
		if (moduleName) {
			if (!this.moduleIdentifierNames?.has(moduleName)) {
				// The identifier for the requested module has not been set
				// This can happen for example if the position of the autofix is not inside
				// a module definition or require block. Therefore the required dependency can not be added
				// and the fix can not be applied.
				return;
			}
			return this.moduleIdentifierNames.get(moduleName)!;
		} else if (globalName) {
			if (!this.globalIdentifierNames?.has(globalName)) {
				// This should not happen, globals can always be provided
				throw new Error("Global identifier has not been provided");
			}
			return this.globalIdentifierNames.get(globalName)!;
		}
	}

	/**
	 * Helper method for fix classes that feature multiple imports/globals.
	 *
	 * Returns undefined if any of the requested identifiers could not be set, indicating that the
	 * fix must not be applied
	 */
	protected getIdentifiersForMultipleRequests(
		moduleNames: string[] | undefined, globalNames: string[] | undefined
	): string[] | undefined {
		const identifiers = []; // Modules first, then globals. Both in the order they have been requested in
		if (moduleNames?.length) {
			if (!this.moduleIdentifierNames) {
				// No modules have been set. Change can not be applied
				return;
			}
			for (const moduleName of moduleNames) {
				if (!this.moduleIdentifierNames.has(moduleName)) {
					// The identifier for the requested module has not been set
					// Change can not be applied
					return;
				}
				identifiers.push(this.moduleIdentifierNames.get(moduleName)!);
			}
		}

		if (globalNames?.length) {
			if (!this.globalIdentifierNames) {
				// This should not happen, globals can always be provided
				throw new Error("Global identifier has not been provided");
			}
			for (const globalName of globalNames) {
				if (!this.globalIdentifierNames.has(globalName)) {
					// This should not happen, globals can always be provided
					throw new Error("Global identifier has not been provided");
				}
				identifiers.push(this.globalIdentifierNames.get(globalName)!);
			}
		}
		return identifiers;
	}

	getNewModuleDependencies(): ModuleDependencyRequest | ModuleDependencyRequest[] | undefined {
		if (this.startPos === undefined) {
			throw new Error("Start position is not defined");
		}
		if (!this.params.moduleName) {
			return;
		}
		return {
			moduleName: this.params.moduleName,
			preferredIdentifier: this.params.preferredIdentifier,
			usagePosition: this.startPos,
		};
	}

	getNewGlobalAccess(): GlobalAccessRequest | GlobalAccessRequest[] | undefined {
		if (this.startPos === undefined) {
			throw new Error("Start position is not defined");
		}
		if (!this.params.globalName) {
			return;
		}
		return {
			globalName: this.params.globalName,
			usagePosition: this.startPos,
		};
	}
}
