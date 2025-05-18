import Fix from "./Fix.js";
import type {AccessExpressionFixTemplate} from "./templates/AccessExpressionFix.js";
import type {CallExpressionFixTemplate} from "./templates/CallExpressionFix.js";

export const enum TEMPLATE_ID {
	// Call expression template replaces the expression's property access with a given module
	CALL_EXPRESSION,

	// Property access expression template replaces a property access expression with a given module
	ACCESS_EXPRESSION,
}

export function createAccessExpressionFixTemplate(
	params: Omit<AccessExpressionFixTemplate, "id">): AccessExpressionFixTemplate {
	return {
		id: TEMPLATE_ID.ACCESS_EXPRESSION,
		...params,
	};
}

export function createCallExpressionFixTemplate(
	params: Omit<CallExpressionFixTemplate, "id">): CallExpressionFixTemplate {
	return {
		id: TEMPLATE_ID.CALL_EXPRESSION,
		...params,
	};
}

export interface FixTemplate {
	id: TEMPLATE_ID;
}

export default abstract class TemplateBasedFix extends Fix {
	constructor(_template: FixTemplate) {
		super();
	}
}
