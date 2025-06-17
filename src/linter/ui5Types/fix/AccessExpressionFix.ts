import {ChangeAction} from "../../../autofix/autofix.js";
import AccessExpressionBaseFix, {AccessExpressionBaseFixParams} from "./AccessExpressionBaseFix.js";

export type AccessExpressionFixParams = AccessExpressionBaseFixParams;

/**
 * Fix a property access. This could also be the property access of a call expression, allowing for a more general
 * replacement in cases where the arguments or other conditions of the call expression do not matter.
 */
export default class AccessExpressionFix extends AccessExpressionBaseFix {
	constructor(protected params: AccessExpressionFixParams) {
		super(params);
	}

	generateChanges() {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start and end position are not defined");
		}

		let value;
		if (this.requestsModuleOrGlobal) {
			const identifier = this.getIdentifiersForSingleRequest(this.params.moduleName, this.params.globalName);
			if (!identifier) {
				// Requests could not be fulfilled, do not generate a change
				return;
			}

			value = identifier;
			if (this.params.propertyAccess) {
				// If a property is defined, we need to access it on the identifier
				value = `${value}.${this.params.propertyAccess}`;
			}
		} else {
			value = this.params.propertyAccess ?? "";
		}
		return {
			action: ChangeAction.REPLACE,
			start: this.startPos,
			end: this.endPos,
			value,
		};
	}
}
