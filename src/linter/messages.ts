import {LintMessageSeverity} from "./LinterContext.js";
import {RULES} from "./linterReporting.js";

export enum MESSAGE {
	DEPRECATED_API_ACCESS,
	DEPRECATED_FUNCTION_CALL,
	DEPRECATED_MODULE_IMPORT,
	DEPRECATED_PROPERTY_OF_CLASS,
	DEPRECATED_PROPERTY,
	LIB_INIT_API_VERSION,
	NO_DIRECT_DATATYPE_ACCESS,
	NO_DIRECT_ENUM_ACCESS,
	NO_GLOBALS,
}
export const MESSAGE_INFO = {

	[MESSAGE.DEPRECATED_API_ACCESS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-api"],

		message: ({apiName}: {apiName: string}) =>
			`Use of deprecated API '${apiName}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_FUNCTION_CALL]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-api"],

		message: ({functionName, additionalMessage}: {functionName: string; additionalMessage: string}) =>
			`Call to deprecated function '${functionName}'${additionalMessage ? ` ${additionalMessage}` : ""}`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_MODULE_IMPORT]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-api"],

		message: ({moduleName}: {moduleName: string}) =>
			`Import of deprecated module '${moduleName}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_PROPERTY_OF_CLASS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-api"],

		message: ({propertyName, className}: {propertyName: string; className: string}) =>
			`Use of deprecated property '${propertyName}' of class '${className}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_PROPERTY]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-property"],

		message: ({propertyName}: {propertyName: string}) =>
			`Use of deprecated property '${propertyName}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.LIB_INIT_API_VERSION]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-partially-deprecated-api"],

		message: ({libInitFunction}: {libInitFunction: string}) =>
			`Call to ${libInitFunction}() must be declared with property {apiVersion: 2}`,
		details: () => `{@link sap.ui.core.Lib.init Lib.init}`,
	},

	[MESSAGE.NO_DIRECT_DATATYPE_ACCESS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-pseudo-modules"],

		message: ({moduleName}: {moduleName: string}) =>
			`Deprecated access to DataType pseudo module '${moduleName}'`,
		details: () =>
			"{@link topic:00737d6c1b864dc3ab72ef56611491c4 Migrating Access to Pseudo Modules}",
	},

	[MESSAGE.NO_DIRECT_ENUM_ACCESS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-pseudo-modules"],

		message: ({moduleName}: {moduleName: string}) =>
			`Deprecated access to enum pseudo module '${moduleName}'`,
		details: () =>
			"{@link topic:00737d6c1b864dc3ab72ef56611491c4 Migrating Access to Pseudo Modules}",
	},

	[MESSAGE.NO_GLOBALS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-globals-js"],

		message: ({variableName, namespace}: {variableName: string; namespace: string}) =>
			`Access of global variable '${variableName}' (${namespace})`,
		details: () => undefined,
	},

} as const;
