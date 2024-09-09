// TODO: Migrate to enum instead of Object/Map
// Currently, it's done this way to avoid pollution of the test snapshots
const RULES = {
	"ui5-linter-async-component-flags": "ui5-linter-async-component-flags",
	"ui5-linter-no-deprecated-api": "ui5-linter-no-deprecated-api",
	"ui5-linter-no-partially-deprecated-api": "ui5-linter-no-partially-deprecated-api",
	"ui5-linter-no-deprecated-property": "ui5-linter-no-deprecated-property",
	"ui5-linter-no-pseudo-modules": "ui5-linter-no-pseudo-modules",
	"ui5-linter-no-globals-js": "ui5-linter-no-globals-js",
	"ui5-linter-parsing-error": "ui5-linter-parsing-error",
	"ui5-linter-no-deprecated-library": "ui5-linter-no-deprecated-library",
	"ui5-linter-no-deprecated-component": "ui5-linter-no-deprecated-component",
	"ui5-linter-csp-unsafe-inline-script": "ui5-linter-csp-unsafe-inline-script",
} as const;

export enum LintMessageSeverity {
	Warning = 1,
	Error = 2,
}

export enum MESSAGE {
	COMPONENT_MISSING_ASYNC_INTERFACE,
	COMPONENT_MISSING_MANIFEST_DECLARATION,
	COMPONENT_REDUNDANT_ASYNC_FLAG,
	CSP_UNSAFE_INLINE_SCRIPT,
	DEPRECATED_API_ACCESS,
	DEPRECATED_CLASS,
	DEPRECATED_COMPONENT,
	DEPRECATED_FUNCTION_CALL,
	DEPRECATED_LIBRARY,
	DEPRECATED_MODULE_IMPORT,
	DEPRECATED_PROPERTY_OF_CLASS,
	DEPRECATED_PROPERTY,
	HTML_IN_XML,
	LIB_INIT_API_VERSION,
	NO_DIRECT_DATATYPE_ACCESS,
	NO_DIRECT_ENUM_ACCESS,
	NO_GLOBALS,
	PARTIALLY_DEPRECATED_PARAMETERS_GET,
	PARTIALLY_DEPRECATED_CREATE_COMPONENT,
	PARTIALLY_DEPRECATED_ODATA_MODEL_V2_CREATE_ENTRY,
	PARTIALLY_DEPRECATED_ODATA_MODEL_V2_CREATE_ENTRY_PROPERTIES_ARRAY,
	PARTIALLY_DEPRECATED_JSON_MODEL_LOAD_DATA,
	PARTIALLY_DEPRECATED_MOBILE_INIT,
	PARTIALLY_DEPRECATED_CORE_ROUTER,
	PARTIALLY_DEPRECATED_ODATA_MODEL_V4,
	PARSING_ERROR,
	SVG_IN_XML,
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

	[MESSAGE.CSP_UNSAFE_INLINE_SCRIPT]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["ui5-linter-csp-unsafe-inline-script"],

		message: () => `Use of unsafe inline script`,
		details: () => `{@link topic:fe1a6dba940e479fb7c3bc753f92b28c Content Security Policy}`,
	},

	[MESSAGE.DEPRECATED_API_ACCESS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-api"],

		message: ({apiName}: {apiName: string}) =>
			`Use of deprecated API '${apiName}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_CLASS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-api"],

		message: ({className}: {className: string}) =>
			`Use of deprecated class '${className}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_COMPONENT]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-component"],

		message: ({componentName}: {componentName: string}) =>
			`Use of deprecated component '${componentName}'`,
		details: () => undefined,
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

	[MESSAGE.HTML_IN_XML]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-api"],

		message: () => `Usage of native HTML in XML Views/Fragments is deprecated`,
		details: () => `{@link topic:be54950cae1041f59d4aa97a6bade2d8 Using Native HTML in XML Views (deprecated)}`,
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

	[MESSAGE.PARTIALLY_DEPRECATED_PARAMETERS_GET]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-partially-deprecated-api"],

		message: () =>
			`Usage of deprecated variant of 'sap/ui/core/theming/Parameters.get'`,
		details: () => `{@link sap.ui.core.theming.Parameters#sap.ui.core.theming.Parameters.get Parameters.get}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_CREATE_COMPONENT]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-partially-deprecated-api"],

		message: () =>
			`Usage of deprecated value for parameter 'async' of 'sap/ui/core/Component#createComponent'`,
		details: () => `Property 'async' must be either omitted or set to true. ` +
			`{@link sap.ui.core.Component#createComponent See API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_ODATA_MODEL_V2_CREATE_ENTRY]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-partially-deprecated-api"],

		message: () =>
			`Usage of deprecated parameter 'batchGroupId' in 'sap/ui/model/odata/v2/ODataModel#createEntry'`,
		details: () => `Use parameter 'groupId' instead. ` +
			`{@link sap.ui.model.odata.v2.ODataModel#createEntry See API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_ODATA_MODEL_V2_CREATE_ENTRY_PROPERTIES_ARRAY]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-partially-deprecated-api"],

		message: () =>
			`Usage of deprecated value for parameter 'properties' in 'sap/ui/model/odata/v2/ODataModel#createEntry'`,
		details: () =>
			`Passing a list of property names is deprecated. Pass the initial values as an object instead. ` +
			`{@link sap.ui.model.odata.v2.ODataModel#createEntry See API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_JSON_MODEL_LOAD_DATA]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-partially-deprecated-api"],

		message: ({paramName}: {paramName: string}) =>
			`Usage of deprecated value for parameter '${paramName}' of 'sap/ui/model/json/JSONModel#loadData'`,
		details: ({paramName}: {paramName: string}) =>
			`Parameter '${paramName}' must be either omitted or set to true. ` +
			`{@link sap.ui.model.json.JSONModel#loadData See API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_MOBILE_INIT]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-partially-deprecated-api"],

		message: ({paramName}: {paramName: string}) =>
			`Usage of deprecated value for parameter '${paramName}' of 'sap/ui/util/Mobile#init'`,
		details: ({paramName}: {paramName: string}) =>
			`Parameter '${paramName}' must be either omitted or set to true. ` +
			`{@link sap.ui.util.Mobile#init See API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_CORE_ROUTER]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-partially-deprecated-api"],

		message: () =>
			`Usage of deprecated value for parameter 'oConfig.async' of constructor 'sap/ui/core/Router'`,
		details: () =>
			`Parameter 'oConfig.async' must be set to true. ` +
			`{@link sap/ui/core/routing/Router#constructor See API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_ODATA_MODEL_V4]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-partially-deprecated-api"],

		message: () =>
			`Usage of deprecated parameter 'mParameters.synchronizationMode' ` +
			`of constructor 'sap/ui/model/odata/v4/ODataModel'`,
		details: () =>
			`Parameter 'synchronizationMode' is obsolete and must be omitted. ` +
			`{@link sap/ui/model/odata/v4/ODataModel#constructor See API reference}`,
	},

	[MESSAGE.PARSING_ERROR]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-parsing-error"],
		fatal: true,

		message: ({message}: {message: string}) => message,
		details: () => undefined,
	},

	[MESSAGE.SVG_IN_XML]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-deprecated-api"],

		message: () => `Usage of SVG in XML Views/Fragments is deprecated`,
		details: () => undefined,
	},

} as const;
