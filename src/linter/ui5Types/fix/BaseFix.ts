import {PositionInfo} from "../../LinterContext.js";
import Fix from "./Fix.js";

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

	// Not yet implemented: Requesting multiple modules
	// modules?: Omit<ModuleDependencyRequest, "usagePosition">[];

	/**
	 * Name of a global variable to use in the fix (e.g. "document")
	 *
	 * The fix will be provided with the identifier name or property access to use via
	 * the setIdentifierForDependency method.
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
	protected moduleIdentifierName: string | undefined;
	protected globalIdentifierName: string | undefined;
	protected sourcePosition: PositionInfo | undefined;

	constructor(protected params: BaseFixParams) {
		super();
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

	setIdentifierForDependency(identifier: string) {
		this.moduleIdentifierName = identifier;
	}

	setIdentifierForGlobal(identifier: string) {
		this.globalIdentifierName = identifier;
	}

	getNewModuleDependencies() {
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

	getNewGlobalAccess() {
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
