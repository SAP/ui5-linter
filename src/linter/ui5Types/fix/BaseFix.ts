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

	/**
	 * Name of the global variable to use in the fix (e.g. "document")
	 */
	global?: string;
	/**
	 * Property access on the module or global
	 *
	 * Example: Migrating "module.property" to "otherModule.otherProperty"
	 * would require this to be set to "otherProperty"
	 */
	propertyAccess?: string;
}

export default abstract class BaseFix extends Fix {
	protected startPos: number | undefined;
	protected endPos: number | undefined;
	protected moduleIdentifierName: string | undefined;
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
}
