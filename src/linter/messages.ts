// TODO: Migrate to enum instead of Object/Map
// Currently, it's done this way to avoid pollution of the test snapshots
const RULES = {
	"async-component-flags": "async-component-flags",
	"csp-unsafe-inline-script": "csp-unsafe-inline-script",
	"no-deprecated-api": "no-deprecated-api",
	"no-deprecated-component": "no-deprecated-component",
	"no-deprecated-control-renderer-declaration": "no-deprecated-control-renderer-declaration",
	"no-deprecated-library": "no-deprecated-library",
	"no-deprecated-theme": "no-deprecated-theme",
	"no-globals": "no-globals",
	"no-implicit-globals": "no-implicit-globals",
	"no-pseudo-modules": "no-pseudo-modules",
	"parsing-error": "parsing-error",
	"ui5-class-declaration": "ui5-class-declaration",
	"prefer-test-starter": "prefer-test-starter",
} as const;

export enum LintMessageSeverity {
	Warning = 1,
	Error = 2,
}

// Messages (sorted alphabetically)
export enum MESSAGE {
	ABANDONED_BOOTSTRAP_PARAM,
	ABANDONED_BOOTSTRAP_PARAM_ERROR,
	COMPONENT_MISSING_ASYNC_INTERFACE,
	COMPONENT_MISSING_MANIFEST_DECLARATION,
	COMPONENT_REDUNDANT_ASYNC_FLAG,
	CSP_UNSAFE_INLINE_SCRIPT,
	DEPRECATED_API_ACCESS,
	DEPRECATED_BOOTSTRAP_PARAM,
	DEPRECATED_CLASS,
	DEPRECATED_INTERFACE,
	DEPRECATED_TYPE,
	DEPRECATED_COMPONENT,
	DEPRECATED_DECLARATIVE_SUPPORT,
	DEPRECATED_FUNCTION_CALL,
	DEPRECATED_LESS_SUPPORT,
	DEPRECATED_LIBRARY,
	DEPRECATED_MANIFEST_JS_RESOURCES,
	DEPRECATED_MODULE_IMPORT,
	DEPRECATED_ODATA_MODEL_V4_SYNCHRONIZATION_MODE,
	DEPRECATED_PROPERTY,
	DEPRECATED_PROPERTY_OF_CLASS,
	DEPRECATED_THEME,
	DEPRECATED_VIEW_TYPE,
	DUPLICATE_BOOTSTRAP_PARAM,
	HTML_IN_XML,
	LIB_INIT_API_VERSION,
	MISSING_BOOTSTRAP_PARAM,
	NO_CONTROL_RERENDER_OVERRIDE,
	NO_DEPRECATED_RENDERER,
	NO_DIRECT_DATATYPE_ACCESS,
	NO_DIRECT_ENUM_ACCESS,
	NO_EXPORTED_VALUES_BY_LIB,
	NO_GLOBALS,
	NO_ICON_POOL_RENDERER,
	NOT_STATIC_CONTROL_RENDERER,
	PARSING_ERROR,
	PARTIALLY_DEPRECATED_CORE_ROUTER,
	PARTIALLY_DEPRECATED_CREATE_COMPONENT,
	PARTIALLY_DEPRECATED_JSON_MODEL_LOAD_DATA,
	PARTIALLY_DEPRECATED_MOBILE_INIT,
	PARTIALLY_DEPRECATED_ODATA_MODEL_V2_CREATE_ENTRY,
	PARTIALLY_DEPRECATED_ODATA_MODEL_V2_CREATE_ENTRY_PROPERTIES_ARRAY,
	PARTIALLY_DEPRECATED_PARAMETERS_GET,
	PREFER_TEST_STARTER,
	REDUNDANT_BOOTSTRAP_PARAM,
	REDUNDANT_BOOTSTRAP_PARAM_ERROR,
	REDUNDANT_VIEW_CONFIG_PROPERTY,
	REPLACED_BOOTSTRAP_PARAM,
	SPELLING_BOOTSTRAP_PARAM,
	SVG_IN_XML,
	MISSING_CONTROL_RENDERER_DECLARATION,
	CONTROL_RENDERER_DECLARATION_STRING,
}
export const MESSAGE_INFO = {

	[MESSAGE.ABANDONED_BOOTSTRAP_PARAM]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["no-deprecated-api"],

		message: ({name}: {name: string}) =>
			`Abandoned bootstrap parameter '${name}' should be removed`,
		details: ({messageDetails}: {messageDetails?: string}) => messageDetails,
	},

	[MESSAGE.ABANDONED_BOOTSTRAP_PARAM_ERROR]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({name}: {name: string}) =>
			`Abandoned bootstrap parameter '${name}' should be removed`,
		details: ({messageDetails}: {messageDetails?: string}) => messageDetails,
	},

	[MESSAGE.COMPONENT_MISSING_ASYNC_INTERFACE]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["async-component-flags"],

		message: () =>
			`Component is not configured for asynchronous loading.`,
		details: ({componentFileName, asyncFlagMissingIn}: {componentFileName: string; asyncFlagMissingIn: string}) =>
			`{@link topic:676b636446c94eada183b1218a824717 Use Asynchronous Loading}. ` +
			`Implement sap.ui.core.IAsyncContentCreation interface in ${componentFileName}. ` +
			`Alternatively, set the 'async' flag to 'true' in ${asyncFlagMissingIn} in the component manifest.`,
	},

	[MESSAGE.COMPONENT_MISSING_MANIFEST_DECLARATION]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["async-component-flags"],

		message: () =>
			`Component does not specify that it uses the descriptor via the manifest.json file`,
		details: () =>
			`A manifest.json has been found in the same directory as the component. Although it will be used at ` +
			`runtime automatically, this should still be expressed in the ` +
			`{@link topic:0187ea5e2eff4166b0453b9dcc8fc64f metadata of the component class}.`,
	},

	[MESSAGE.COMPONENT_REDUNDANT_ASYNC_FLAG]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["async-component-flags"],

		message: ({asyncFlagLocation}: {asyncFlagLocation: string}) =>
			`Component implements the sap.ui.core.IAsyncContentCreation interface. ` +
			`The redundant 'async' flag at '${asyncFlagLocation}' should be removed from the component manifest`,
		details: () =>
			`{@link sap.ui.core.IAsyncContentCreation sap.ui.core.IAsyncContentCreation}`,
	},

	[MESSAGE.CSP_UNSAFE_INLINE_SCRIPT]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["csp-unsafe-inline-script"],

		message: () => `Use of unsafe inline script`,
		details: () => `{@link topic:fe1a6dba940e479fb7c3bc753f92b28c Content Security Policy}`,
	},

	[MESSAGE.DEPRECATED_API_ACCESS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({apiName}: {apiName: string}) =>
			`Use of deprecated API '${apiName}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_BOOTSTRAP_PARAM]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({name, value}: {name: string; value: string}) =>
			`Use of deprecated value '${value}' for bootstrap parameter '${name}'`,
		details: ({details}: {details?: string}) => details,
	},

	[MESSAGE.DEPRECATED_CLASS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({className}: {className: string}) =>
			`Use of deprecated class '${className}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_INTERFACE]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({interfaceName}: {interfaceName: string}) =>
			`Use of deprecated interface '${interfaceName}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_TYPE]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({typeName}: {typeName: string}) =>
			`Use of deprecated type '${typeName}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_COMPONENT]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-component"],

		message: ({componentName}: {componentName: string}) =>
			`Use of deprecated component '${componentName}'`,
		details: () => undefined,
	},

	[MESSAGE.DEPRECATED_DECLARATIVE_SUPPORT]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () => `DeclarativeSupport is deprecated`,
		details: () =>
			`Please consider using {@link sap.ui.core.mvc.XMLView XMLViews} or` +
			` {@link topic:e6bb33d076dc4f23be50c082c271b9f0 Typed Views} instead. For more information,` +
			` see the documentation on {@link topic:91f27e3e6f4d1014b6dd926db0e91070 View types}.`,
	},

	[MESSAGE.DEPRECATED_FUNCTION_CALL]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({functionName, additionalMessage}: {functionName: string; additionalMessage: string}) =>
			`Call to deprecated function '${functionName}'${additionalMessage ? ` ${additionalMessage}` : ""}`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_LESS_SUPPORT]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () => `LessSupport is deprecated`,
		details: () =>
			"Please consider using UI5 Tooling https://sap.github.io/ui5-tooling/stable/ to compile LESS to CSS on the fly.",
	},

	[MESSAGE.DEPRECATED_LIBRARY]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-library"],

		message: ({libraryName}: {libraryName: string}) =>
			`Use of deprecated library '${libraryName}'`,
		details: () => undefined,
	},

	[MESSAGE.DEPRECATED_MANIFEST_JS_RESOURCES]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () =>
			`Use of deprecated property 'sap.ui5/resources/js'`,
		details: () => "As of version 1.94, the usage of js resources is deprecated. " +
			"Please use regular dependencies instead.",
	},

	[MESSAGE.DEPRECATED_MODULE_IMPORT]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({moduleName}: {moduleName: string}) =>
			`Import of deprecated module '${moduleName}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_ODATA_MODEL_V4_SYNCHRONIZATION_MODE]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({modelName}: {modelName?: string}) =>
			`Usage of deprecated parameter 'synchronizationMode' ` +
			`of constructor 'sap/ui/model/odata/v4/ODataModel'${modelName ? ` (model: '${modelName}')` : ""}`,
		details: () =>
			`As of version 1.110.0, the 'synchronizationMode' parameter is obsolete and must be omitted. ` +
			`{@link sap/ui/model/odata/v4/ODataModel#constructor See the API reference}`,
	},

	[MESSAGE.DEPRECATED_PROPERTY]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({propertyName}: {propertyName: string}) =>
			`Use of deprecated property '${propertyName}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_PROPERTY_OF_CLASS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({propertyName, className}: {propertyName: string; className: string}) =>
			`Use of deprecated property '${propertyName}' of class '${className}'`,
		details: ({details}: {details: string}) => details,
	},

	[MESSAGE.DEPRECATED_THEME]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-theme"],

		message: ({themeName}: {themeName: string}) =>
			`Use of deprecated theme '${themeName}'`,
		details: () => `{@link topic:a87ca843bcee469f82a9072927a7dcdb Deprecated Themes and Libraries}`,
	},

	[MESSAGE.DEPRECATED_VIEW_TYPE]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({viewType}: {viewType: string}) =>
			`Use of deprecated view type '${viewType}'. Use 'XML' instead'`,
		details: () => undefined,
	},

	[MESSAGE.DUPLICATE_BOOTSTRAP_PARAM]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["no-deprecated-api"],

		message: ({name, value}: {name: string; value: string}) =>
			`Duplicate bootstrap parameter '${name}' with value '${value}'`,
		details: () => undefined,
	},

	[MESSAGE.MISSING_BOOTSTRAP_PARAM]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({name}: {name: string}) =>
			`Missing bootstrap parameter '${name}'`,
		details: ({details}: {details?: string}) => details,
	},

	[MESSAGE.HTML_IN_XML]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () => `Usage of native HTML in XML Views/Fragments is deprecated`,
		details: () => `{@link topic:be54950cae1041f59d4aa97a6bade2d8 Using Native HTML in XML Views (deprecated)}`,
	},

	[MESSAGE.LIB_INIT_API_VERSION]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({libInitFunction}: {libInitFunction: string}) =>
			`Deprecated call to ${libInitFunction}(). Use the {apiVersion: 2} parameter instead`,
		details: () => `{@link sap.ui.core.Lib.init Lib.init}`,
	},

	[MESSAGE.NO_CONTROL_RERENDER_OVERRIDE]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],
		message: ({className}: {className: string}) =>
			`Override of deprecated method 'rerender' in control '${className}'`,
		details: () => `Starting from UI5 1.121 the framework no longer calls 'rerender', ` +
			`so there is no point in overriding it. ` +
			`Move any rendering related code to the renderer or into onBeforeRendering/onAfterRendering.`,
	},

	[MESSAGE.NO_DEPRECATED_RENDERER]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () =>
			`Use of deprecated renderer detected. Define explicitly the {apiVersion: 2} parameter ` +
			`in the renderer object`,
		details: () => `{@link topic:c9ab34570cc14ea5ab72a6d1a4a03e3f Renderer Object}`,
	},

	[MESSAGE.NO_ICON_POOL_RENDERER]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () =>
			`"sap/ui/core/IconPool" module must be imported when using RenderManager's icon() method`,
		details: () => `{@link sap.ui.core.RenderManager#methods/icon RenderManager}`,
	},

	[MESSAGE.NOT_STATIC_CONTROL_RENDERER]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["ui5-class-declaration"],

		message: ({className}: {className?: string}) =>
			`The control renderer${className ? (" of '" + className + "'") : ""} must be a static property`,
		details: () => undefined,
	},

	[MESSAGE.NO_DIRECT_DATATYPE_ACCESS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-pseudo-modules"],

		message: ({moduleName}: {moduleName: string}) =>
			`Deprecated access of DataType pseudo module '${moduleName}'`,
		details: () =>
			"{@link topic:00737d6c1b864dc3ab72ef56611491c4 Migrating Access to Pseudo Modules}",
	},

	[MESSAGE.NO_DIRECT_ENUM_ACCESS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-pseudo-modules"],

		message: ({moduleName}: {moduleName: string}) =>
			`Deprecated access of enum pseudo module '${moduleName}'`,
		details: () =>
			"{@link topic:00737d6c1b864dc3ab72ef56611491c4 Migrating Access to Pseudo Modules}",
	},

	[MESSAGE.NO_GLOBALS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-globals"],

		message: ({variableName, namespace}: {variableName: string; namespace: string}) =>
			`Access of global variable '${variableName}' (${namespace})`,
		details: () =>
			`Do not use global variables to access UI5 modules or APIs. ` +
			`{@link topic:28fcd55b04654977b63dacbee0552712 See Best Practices for Developers}`,
	},

	[MESSAGE.PARSING_ERROR]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["parsing-error"],
		fatal: true,

		message: ({message}: {message: string}) => message,
		details: () => `Check the source file for syntax errors`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_CORE_ROUTER]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () =>
			`Usage of deprecated value for parameter 'oConfig.async' of constructor 'sap/ui/core/Router'`,
		details: () =>
			`The 'oConfig.async' parameter must be set to true. ` +
			`{@link sap/ui/core/routing/Router#constructor See the API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_CREATE_COMPONENT]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () =>
			`Usage of deprecated value for parameter 'async' of 'sap/ui/core/Component#createComponent'`,
		details: () => `The 'async' property must be either omitted or set to true. ` +
			`{@link sap.ui.core.Component#createComponent See the API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_JSON_MODEL_LOAD_DATA]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({paramName}: {paramName: string}) =>
			`Usage of deprecated value for parameter '${paramName}' of 'sap/ui/model/json/JSONModel#loadData'`,
		details: ({paramName}: {paramName: string}) =>
			`Parameter '${paramName}' must be either omitted or set to true. ` +
			`{@link sap.ui.model.json.JSONModel#loadData See API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_MOBILE_INIT]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({paramName}: {paramName: string}) =>
			`Usage of deprecated value for parameter '${paramName}' of 'sap/ui/util/Mobile#init'`,
		details: ({paramName}: {paramName: string}) =>
			`Parameter '${paramName}' must be either omitted or set to true. ` +
			`{@link sap.ui.util.Mobile#init See API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_ODATA_MODEL_V2_CREATE_ENTRY]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () =>
			`Usage of deprecated parameter 'batchGroupId' in 'sap/ui/model/odata/v2/ODataModel#createEntry'`,
		details: () => `Use the 'groupId' parameter instead. ` +
			`{@link sap.ui.model.odata.v2.ODataModel#createEntry See the API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_ODATA_MODEL_V2_CREATE_ENTRY_PROPERTIES_ARRAY]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () =>
			`Usage of deprecated value for parameter 'properties' in 'sap/ui/model/odata/v2/ODataModel#createEntry'`,
		details: () =>
			`Passing a list of property names is deprecated. Pass the initial values as an object instead. ` +
			`{@link sap.ui.model.odata.v2.ODataModel#createEntry See the API reference}`,
	},

	[MESSAGE.PARTIALLY_DEPRECATED_PARAMETERS_GET]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () =>
			`Usage of deprecated variant of 'sap/ui/core/theming/Parameters.get'`,
		details: () => `{@link sap.ui.core.theming.Parameters#sap.ui.core.theming.Parameters.get Parameters.get}`,
	},

	[MESSAGE.REDUNDANT_BOOTSTRAP_PARAM]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["no-deprecated-api"],

		message: ({name}: {name: string}) =>
			`Redundant bootstrap parameter '${name}' should be removed`,
		details: ({messageDetails}: {messageDetails?: string}) => messageDetails,
	},

	[MESSAGE.REDUNDANT_BOOTSTRAP_PARAM_ERROR]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({name}: {name: string}) =>
			`Redundant bootstrap parameter '${name}' should be removed`,
		details: ({messageDetails}: {messageDetails?: string}) => messageDetails,
	},

	[MESSAGE.REDUNDANT_VIEW_CONFIG_PROPERTY]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["no-deprecated-api"],

		message: ({propertyName}: {propertyName: string}) =>
			`Redundant view configuration property '${propertyName}' can be omitted`,
		details: () => undefined,
	},

	[MESSAGE.SPELLING_BOOTSTRAP_PARAM]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["no-deprecated-api"],

		message: ({oldName, newName}: {oldName: string; newName: string}) =>
			`Outdated spelling of bootstrap parameter: '${oldName}'; should be written as '${newName}'`,
		details: () => undefined,
	},

	[MESSAGE.SVG_IN_XML]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: () => `Deprecated use of SVG in XML View or Fragment`,
		details: () => `{@link topic:28fcd55b04654977b63dacbee0552712 See Best Practices for Developers}`,
	},

	[MESSAGE.MISSING_CONTROL_RENDERER_DECLARATION]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-control-renderer-declaration"],

		message: ({className}: {className: string}) =>
			`Control '${className}' is missing a renderer declaration`,
		details: ({className}: {className: string}) => `Not defining a 'renderer' for control '${className}' ` +
			`may lead to synchronous loading of the '${className}Renderer' module. ` +
			`If no renderer exists, set 'renderer: null'. Otherwise, either import the renderer module ` +
			`and assign it to the 'renderer' property or implement the renderer inline.`,
	},

	[MESSAGE.CONTROL_RENDERER_DECLARATION_STRING]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-control-renderer-declaration"],

		message: ({className, rendererName}: {className: string; rendererName: string | undefined}) =>
			`Deprecated declaration of renderer ${rendererName ? `'${rendererName}' ` : ""}for control '${className}'`,
		details: ({className, rendererName}: {className: string; rendererName: string | undefined}) => {
			const rendererModuleName = rendererName ? `'${rendererName.replace(/\./g, "/")}'` : "renderer";
			return `Defining the 'renderer' for control '${className}' by its name may lead to synchronous ` +
				`loading of the ${rendererModuleName} module. ` +
				`Import the ${rendererModuleName} module and assign it to the 'renderer' property.`;
		},
	},

	[MESSAGE.PREFER_TEST_STARTER]: {
		severity: LintMessageSeverity.Warning,
		ruleId: RULES["prefer-test-starter"],

		message: () => "To save boilerplate code and ensure compliance with UI5 2.x best practices," +
			" please migrate to the Test Starter concept",
		details: () => "{@link topic:032be2cb2e1d4115af20862673bedcdb Test Starter}",
	},

	[MESSAGE.REPLACED_BOOTSTRAP_PARAM]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-deprecated-api"],

		message: ({name, replacement}: {name: string; replacement: string}) =>
			`Bootstrap parameter '${name}' should be replaced with '${replacement}'`,
		details: ({messageDetails}: {messageDetails: string}) => messageDetails,
	},

	[MESSAGE.NO_EXPORTED_VALUES_BY_LIB]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["no-implicit-globals"],

		message: ({module, namespace, libraryName}: {module: string; namespace: string; libraryName: string}) =>
			`Access of module '${module}' (${namespace}) not exported by library '${libraryName}'`,
		details: () =>
			`Please import the module itself directly instead of accessing it via the library module.`,
	},

} as const;
