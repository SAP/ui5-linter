import {ChangeAction} from "../../../autofix/autofix.js";
import AccessExpressionBaseFix, {AccessExpressionBaseFixParams} from "./AccessExpressionBaseFix.js";

export interface AccessExpressionGeneratorFixParams extends AccessExpressionBaseFixParams {

	/**
	 * The generator function will be used to determine the value of the replacement, affecting
	 * the whole access expression
	 *
	 * If the return value is undefined, no change will be generated
	 */
	generator: (identifierName: string | undefined) => string | undefined;
}

/**
 * Fix a property access. This could also be the property access of a call expression, allowing for a more general
 * replacement in cases where the arguments or other conditions of the call expression do not matter.
 */
export default class AccessExpressionGeneratorFix extends AccessExpressionBaseFix {
	constructor(protected params: AccessExpressionGeneratorFixParams) {
		super(params);
	}

	generateChanges() {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start and end position are not defined");
		}
		if (this.params.moduleName && !this.moduleIdentifierName) {
			// The identifier for the requested module has not been set
			// This can happen for example if the position of the autofix is not inside
			// a module definition or require block. Therefore the required dependency can not be added
			// and the fix can not be applied.
			return;
		}
		if (this.params.globalName && !this.globalIdentifierName) {
			// This should not happen
			throw new Error("Global identifier has not been provided");
		}

		// If a generator function is provided, use it to generate the change
		const value = this.params.generator(this.globalIdentifierName ?? this.moduleIdentifierName);
		if (!value) {
			return;
		}
		return {
			action: ChangeAction.REPLACE,
			start: this.startPos,
			end: this.endPos,
			value,
		};
	}
}
