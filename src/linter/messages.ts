import {LintMessageSeverity} from "./LinterContext.js";
import {RULES} from "./linterReporting.js";

export enum MESSAGE {
	COMPONENT_MISSING_ASYNC_INTERFACE,
	COMPONENT_MISSING_MANIFEST_DECLARATION,
	COMPONENT_REDUNDANT_ASYNC_FLAG,
	DEPRECATED_API_ACCESS,
	DEPRECATED_FUNCTION_CALL,
	DEPRECATED_LIBRARY,
	DEPRECATED_MODULE_IMPORT,
	DEPRECATED_PROPERTY_OF_CLASS,
	DEPRECATED_PROPERTY,
	LIB_INIT_API_VERSION,
	NO_DIRECT_DATATYPE_ACCESS,
	NO_DIRECT_ENUM_ACCESS,
	NO_GLOBALS,
}
export const MESSAGE_INFO = {

	[MESSAGE.COMPONENT_MISSING_ASYNC_INTERFACE]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-async-component-flags"],

		message: () =>
			`Component is not configured for asynchronous loading.`,
		details: ({componentFileName, asyncFlagMissingIn}: {componentFileName: string; asyncFlagMissingIn: string}) =>
			`{@link topic:676b636446c94eada183b1218a824717 Use Asynchronous Loading}. ` +
			`Implement sap.ui.core.IAsyncContentCreation interface in ${componentFileName}. ` +
			`Alternatively, set the "async" flag to "true" in ${asyncFlagMissingIn} in the component manifest.`,
	},

	[MESSAGE.COMPONENT_MISSING_MANIFEST_DECLARATION]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["ui5-linter-async-component-flags"],

		message: () =>
			`Component does not specify that it uses the descriptor via the manifest.json file`,
		details: () =>
			`A manifest.json has been found in the same directory as the component. Although it will be used at ` +
			`runtime automatically, this should still be expressed in the ` +
			`{@link topic:0187ea5e2eff4166b0453b9dcc8fc64f metadata of the component class}.`,
	},

	[MESSAGE.COMPONENT_REDUNDANT_ASYNC_FLAG]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["ui5-linter-async-component-flags"],

		message: ({asyncFlagLocation}: {asyncFlagLocation: string}) =>
			`Component implements the sap.ui.core.IAsyncContentCreation interface. ` +
			`The redundant "async" flag at "${asyncFlagLocation}" should be removed from the component manifest`,
		details: () =>
			`{@link sap.ui.core.IAsyncContentCreation sap.ui.core.IAsyncContentCreation}`,
	},

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

	[MESSAGE.DEPRECATED_LIBRARY]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-library"],

		message: ({libraryName}: {libraryName: string}) =>
			`Use of deprecated library '${libraryName}'`,
		details: () => undefined,
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
