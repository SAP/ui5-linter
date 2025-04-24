import ts from "typescript";
import {AmbientModuleCache} from "./AmbientModuleCache.js";
import {isConditionalAccess, isGlobalAssignment} from "./utils/utils.js";

export interface FixHints {
	/**
	 * New module name to import from
	 */
	moduleName?: string;

	/**
	 * Name of the export to be used (based on the newly imported module)
	 * e.g. for moduleName "sap/base/i18n/ResourceBundle" the exportNameToBeUsed is "create"
	 */
	exportNameToBeUsed?: string;

	/**
	 * Code to be replaced
	 * In some cases the replacement is not a module import but could be a native API,
	 * or a different function with different arguments.
	 */
	exportCodeToBeUsed?: string | {
		name: string;
		solutionLength: number;
		moduleNameIdentifier?: string;
		args?: string[];
	};

	/**
	 * String representation of the property access to be replaced
	 */
	propertyAccess?: string;

	/**
	 * Whether the access is conditional / probing / lazy
	 * e.g. `if (window.sap.ui.layout) { ... }`
	 */
	conditional?: boolean;
}

const jQuerySapModulesReplacements = new Map<string, FixHints>([
	// https://github.com/SAP/ui5-linter/issues/520
	["assert", {
		moduleName: "sap/base/assert",
	}],
	// https://github.com/SAP/ui5-linter/issues/522
	["log", {
		moduleName: "sap/base/Log", exportCodeToBeUsed: "$moduleIdentifier.getLogger()",
	}],
	["log.addLogListener", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "addLogListener",
	}],
	// Note: Not 1:1 compatible. Does not return an instance of the logger
	["log.debug", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "debug",
	}],
	// Note: Not 1:1 compatible. Does not return an instance of the logger
	["log.error", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "error",
	}],
	// Note: Not 1:1 compatible. Does not return an instance of the logger
	["log.fatal", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "fatal",
	}],
	// Note: Not 1:1 compatible. Does not return an instance of the logger
	["log.info", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "info",
	}],
	// Note: Not 1:1 compatible. Does not return an instance of the logger
	["log.trace", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "trace",
	}],
	// Note: Not 1:1 compatible. Does not return an instance of the logger
	["log.warning", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "warning",
	}],
	["log.getLevel", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "getLevel",
	}],
	["log.setLevel", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "setLevel",
	}],
	["log.getLog", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "getLogEntries",
	}],
	["log.getLogEntries", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "getLogEntries",
	}],
	["log.getLogger", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "getLogger",
	}],
	["log.Level.NONE", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "Level.NONE",
	}],
	["log.Level.FATAL", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "Level.FATAL",
	}],
	["log.Level.ERROR", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "Level.ERROR",
	}],
	["log.Level.WARNING", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "Level.WARNING",
	}],
	["log.Level.INFO", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "Level.INFO",
	}],
	["log.Level.TRACE", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "Level.TRACE",
	}],
	["log.Level.ALL", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "Level.ALL",
	}],
	["log.Level", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "Level",
	}],
	["log.LogLevel", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "Level",
	}],
	["log.logSupportInfo", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "logSupportInfo",
	}],
	["log.removeLogListener", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "removeLogListener",
	}],
	["log.isLoggable", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "isLoggable",
	}],
	// https://github.com/SAP/ui5-linter/issues/521
	["resources", {
		moduleName: "sap/base/i18n/ResourceBundle", exportNameToBeUsed: "create",
	}],
	// https://github.com/SAP/ui5-linter/issues/524
	["encodeCSS", {
		moduleName: "sap/base/security/encodeCSS",
	}],
	["encodeJS", {
		moduleName: "sap/base/security/encodeJS",
	}],
	["encodeURL", {
		moduleName: "sap/base/security/encodeURL",
	}],
	["encodeURLParameters", {
		moduleName: "sap/base/security/encodeURLParameters",
	}],
	["encodeHTML", {
		moduleName: "sap/base/security/encodeXML",
	}],
	["encodeXML", {
		moduleName: "sap/base/security/encodeXML",
	}],

	// https://github.com/SAP/ui5-linter/issues/525
	["addUrlWhitelist", {
		moduleName: "sap/base/security/URLListValidator", exportNameToBeUsed: "add",
	}],
	["clearUrlWhitelist", {
		moduleName: "sap/base/security/URLListValidator", exportNameToBeUsed: "clear",
	}],
	["getUrlWhitelist", {
		moduleName: "sap/base/security/URLListValidator", exportNameToBeUsed: "entries",
	}],
	["validateUrl", {
		moduleName: "sap/base/security/URLListValidator", exportNameToBeUsed: "validate",
	}],
	["removeUrlWhitelist", {
		moduleName: "sap/base/security/URLListValidator",
		exportCodeToBeUsed: `var $identifier_1 = $moduleIdentifier.entries();
$identifier_1.splice($1, 1);
$moduleIdentifier.clear();
$identifier_1.forEach(({protocol, host, port, path}) => $moduleIdentifier.add(protocol, host, port, path))`,
	}],

	// https://github.com/SAP/ui5-linter/issues/527
	["camelCase", {
		moduleName: "sap/base/strings/camelize",
	}],
	["charToUpperCase", {
		moduleName: "sap/base/strings/capitalize",
		/* This migration requires special handling:
			Since the capitalize module does not accept a position argument, this migration must
			only be applied if it is the first character that is supposed to be capitalized.
			In the legacy charToUpperCase API, this is controlled by the second argument ("position").
			If it is omitted, set to zero, a negative number, or beyond the last character,
			the first character is to be capitalized.
			In all other cases, this migration must not be applied.
		*/
		exportCodeToBeUsed: "$moduleIdentifier($1)",
	}],
	["escapeRegExp", {
		moduleName: "sap/base/strings/escapeRegExp",
	}],
	["formatMessage", {
		moduleName: "sap/base/strings/formatMessage",
	}],
	["hashCode", {
		moduleName: "sap/base/strings/hash",
	}],
	["hyphen", {
		moduleName: "sap/base/strings/hyphenate",
	}],
	["isStringNFC", {
		exportCodeToBeUsed: "$1.normalize(\"NFC\") === $1",
	}],
	// https://github.com/SAP/ui5-linter/issues/528
	["arraySymbolDiff", {
		moduleName: "sap/base/util/array/diff",
	}],
	["unique", {
		moduleName: "sap/base/util/array/uniqueSort",
	}],
	// https://github.com/SAP/ui5-linter/issues/529
	["equal", {
		moduleName: "sap/base/util/deepEqual",
	}],
	["each", {
		moduleName: "sap/base/util/each",
	}],
	["forIn", {
		moduleName: "sap/base/util/each",
	}],
	// ["isPlainObject", {
	// 	// TODO MB: jQuery.isPlainObject is a jQuery deprecation and currently out-of-scope for UI5 Linter
	// 	moduleName: "sap/base/util/isPlainObject",
	// }],
	["FrameOptions", {
		moduleName: "sap/ui/security/FrameOptions",
	}],
	["parseJS", {
		moduleName: "sap/base/util/JSTokenizer", exportNameToBeUsed: "parseJS",
	}],
	["extend", {
		/* This migration requires special handling:
			jQuery.sap.extends has an optional first argument "deep" which controls whether
			a shallow or deep copy is performed.

			In case of a shallow clone (default), Object.assign might be a suitable replacement?
			TODO MB: Discuss with team. Documentation states "No actual replacement for shallow copies available"

			Only in case of a deep clone (first argument is true; explicitly type "boolean"),
			the merge module shall be used (omitting the first argument)
		*/
		moduleName: "sap/base/util/merge", exportCodeToBeUsed: "$moduleIdentifier($1, $2, $3)",
	}],
	["now", {
		moduleName: "sap/base/util/now",
	}],
	["properties", {
		moduleName: "sap/base/util/Properties", exportNameToBeUsed: "create",
	}],
	["uid", {
		moduleName: "sap/base/util/uid",
	}],
	["Version", {
		moduleName: "sap/base/util/Version",
	}],
	["syncStyleClass", {
		moduleName: "sap/ui/core/syncStyleClass",
	}],
	["setObject", {
		// Needs to use "exportCodeToBeUsed" prop as the first argument MUST be patched to be a string
		moduleName: "sap/base/util/ObjectPath", exportCodeToBeUsed: "$moduleIdentifier.set($1, $2, $3)",
	}],
	["getObject", {
		// TODO: Might not be able to migrate. API is not 1:1
		// Getter creates empty object and sub objects with null values.
		// Requires code touch
		moduleName: "sap/base/util/ObjectPath", exportCodeToBeUsed: "$moduleIdentifier.get($1, $3)",
	}],
	// https://github.com/SAP/ui5-linter/issues/542
	["containsOrEquals", {
		moduleName: "sap/ui/dom/containsOrEquals",
	}],
	["denormalizeScrollBeginRTL", {
		moduleName: "sap/ui/dom/denormalizeScrollBeginRTL",
	}],
	["denormalizeScrollLeftRTL", {
		moduleName: "sap/ui/dom/denormalizeScrollLeftRTL",
	}],
	["ownerWindow", {
		moduleName: "sap/ui/dom/getOwnerWindow",
	}],
	["scrollbarSize", {
		moduleName: "sap/ui/dom/getScrollbarSize",
	}],
	["includeScript", {
		moduleName: "sap/ui/dom/includeScript",
	}],
	["includeStylesheet", {
		moduleName: "sap/ui/dom/includeStylesheet",
	}],
	["replaceDOM", {
		// TODO MB: "sap/ui/dom/patch" has been removed in
		// https://github.com/SAP/openui5/commit/84ae02e870d8349acff17febeac6fb1404d6bb5a#diff-b54e0a67288dd55b118578ef716ece9c9ccf2a5c2ef6be53f90f636e4aa41b70
		// Therefore this migration is not valid and should be removed
		moduleName: "sap/ui/dom/patch",
	}],
	["pxToRem", {
		moduleName: "sap/ui/dom/units/Rem", exportNameToBeUsed: "fromPx",
	}],
	["remToPx", {
		moduleName: "sap/ui/dom/units/Rem", exportNameToBeUsed: "toPx",
	}],
	// https://github.com/SAP/ui5-linter/issues/543
	["checkMouseEnterOrLeave", {
		moduleName: "sap/ui/events/checkMouseEnterOrLeave",
	}],
	["bindAnyEvent", {
		moduleName: "sap/ui/events/ControlEvents", exportNameToBeUsed: "bindAnyEvent",
	}],
	["unbindAnyEvent", {
		moduleName: "sap/ui/events/ControlEvents", exportNameToBeUsed: "unbindAnyEvent",
	}],
	["ControlEvents", {
		moduleName: "sap/ui/events/ControlEvents", exportNameToBeUsed: "events",
	}],
	["handleF6GroupNavigation", {
		moduleName: "sap/ui/events/F6Navigation", exportNameToBeUsed: "handleF6GroupNavigation",
	}],
	["isMouseEventDelayed", {
		// It used to be a property and now is a function that needs to be called
		moduleName: "sap/ui/events/isMouseEventDelayed", exportCodeToBeUsed: "$moduleIdentifier()",
	}],
	["isSpecialKey", {
		// Note: The new isSpecialKey module does not cover legacy edge cases where
		// Event.key is not defined, e.g. when jQuery.Events are created manually
		moduleName: "sap/ui/events/isSpecialKey",
	}],
	["touchEventMode", {
		moduleName: "sap/ui/events/jquery/EventSimulation", exportNameToBeUsed: "touchEventMode",
	}],
	["keycodes", {
		// TODO MB: Is the exportCodeToBeUsed attribute really required here?
		moduleName: "sap/ui/events/KeyCodes", exportCodeToBeUsed: "$moduleIdentifier",
	}],
	["PseudoEvents", {
		// TODO MB: Should use .events on new module
		// See https://sapui5.hana.ondemand.com/sdk/#/api/jQuery.sap.PseudoEvents
		moduleName: "sap/ui/events/PseudoEvents", exportCodeToBeUsed: "$moduleIdentifier",
	}],
	["disableTouchToMouseHandling", {
		moduleName: "sap/ui/events/TouchToMouseMapping", exportNameToBeUsed: "disableTouchToMouseHandling",
	}],
	// https://github.com/SAP/ui5-linter/issues/555

	// TODO MB: Missing replacement for jQuery.sap.measure.getRequestTimings?
	["measure.getRequestTimings", {
		exportCodeToBeUsed: "performance.getEntriesByType(\"resource\")",
	}],
	["measure.setRequestBufferSize", {
		exportCodeToBeUsed: "performance.setResourceTimingBufferSize($1)",
	}],
	// https://sapui5.hana.ondemand.com/sdk/#/api/jQuery.sap.measure%23methods/jQuery.sap.measure.getRequestTimings
	["measure.start", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "start",
	}],
	["measure.add", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "add",
	}],
	["measure.end", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "end",
	}],
	["measure.average", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "average",
	}],
	["measure.clear", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "clear",
	}],
	["measure.filterMeasurements", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "filterMeasurements",
	}],
	["measure.getAllMeasurements", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "getAllMeasurements",
	}],
	["measure.getMeasurement", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "getMeasurement",
	}],
	["measure.pause", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "pause",
	}],
	["measure.resume", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "resume",
	}],
	["measure.getActive", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "getActive",
	}],
	["measure.setActive", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "setActive",
	}],
	["measure.remove", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "remove",
	}],
	["measure.registerMethod", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "registerMethod",
	}],
	["measure.unregisterMethod", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "unregisterMethod",
	}],
	["measure.unregisterAllMethods", {
		moduleName: "sap/ui/performance/Measurement", exportNameToBeUsed: "unregisterAllMethods",
	}],
	// https://github.com/SAP/ui5-linter/issues/561
	["fesr.setActive", {
		moduleName: "sap/ui/performance/trace/FESR", exportNameToBeUsed: "setActive",
	}],
	["fesr.getActive", {
		moduleName: "sap/ui/performance/trace/FESR", exportNameToBeUsed: "getActive",
	}],
	["fesr.addBusyDuration", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "addBusyDuration",
	}],
	["interaction.getActive", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "getActive",
	}],
	["interaction.setActive", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "setActive",
	}],
	["interaction.notifyStepStart", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "notifyStepStart",
	}],
	["interaction.notifyStepEnd", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "notifyStepEnd",
	}],
	["interaction.notifyEventStart", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "notifyEventStart",
	}],
	["interaction.notifyScrollEvent", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "notifyScrollEvent",
	}],
	["interaction.notifyEventEnd", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "notifyEventEnd",
	}],
	["interaction.setStepComponent", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "setStepComponent",
	}],
	["measure.clearInteractionMeasurements", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "clear",
	}],
	["measure.startInteraction", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "start",
	}],
	["measure.endInteraction", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "end",
	}],
	["measure.filterInteractionMeasurements", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "filter",
	}],
	["measure.getAllInteractionMeasurements", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "getAll",
	}],
	["measure.getPendingInteractionMeasurement", {
		moduleName: "sap/ui/performance/trace/Interaction", exportNameToBeUsed: "getPending",
	}],
	["fesr.getCurrentTransactionId", {
		moduleName: "sap/ui/performance/trace/Passport", exportNameToBeUsed: "getCurrentTransactionId",
	}],
	["fesr.getRootId", {
		moduleName: "sap/ui/performance/trace/Passport", exportNameToBeUsed: "getRootId",
	}],
	["passport.setActive", {
		moduleName: "sap/ui/performance/trace/Passport", exportNameToBeUsed: "setActive",
	}],
	["passport.traceFlags", {
		moduleName: "sap/ui/performance/trace/Passport", exportNameToBeUsed: "traceFlags",
	}],
	// https://github.com/SAP/ui5-linter/issues/563

	// TODO MB: Possibly missing some replacements, see https://github.com/SAP/ui5-linter/issues/563
	["act.isActive", {
		moduleName: "sap/ui/util/ActivityDetection", exportNameToBeUsed: "isActive",
	}],
	["initMobile", {
		moduleName: "sap/ui/util/Mobile", exportNameToBeUsed: "init",
	}],
	["setIcons", {
		moduleName: "sap/ui/util/Mobile", exportNameToBeUsed: "setIcons",
	}],
	["setMobileWebAppCapable", {
		moduleName: "sap/ui/util/Mobile", exportNameToBeUsed: "setWebAppCapable",
	}],
	["storage", {
		moduleName: "sap/ui/util/Storage", exportCodeToBeUsed: "new $moduleIdentifier($1, $2)",
	}],
	["getParseError", {
		moduleName: "sap/ui/util/XMLHelper", exportNameToBeUsed: "getParseError",
	}],
	["parseXML", {
		moduleName: "sap/ui/util/XMLHelper", exportNameToBeUsed: "parse",
	}],
	["serializeXML", {
		moduleName: "sap/ui/util/XMLHelper", exportNameToBeUsed: "serialize",
	}],

	["device.is.standalone", {
		exportCodeToBeUsed: "window.navigator.standalone",
	}],
	["support.retina", {
		exportCodeToBeUsed: "window.devicePixelRatio >= 2",
	}],
	// TODO: Shall we add validation for a string?
	["startsWith", {
		exportCodeToBeUsed: "$1.startsWith($2)",
	}],
	// TODO: Shall we add validation for a string?
	["startsWithIgnoreCase", {
		exportCodeToBeUsed: "$1.toLowerCase().startsWith($2)",
	}],
	// TODO: Shall we add validation for a string?
	["endsWith", {
		exportCodeToBeUsed: "$1.endsWith($2)",
	}],
	// TODO: Shall we add validation for a string?
	["endsWithIgnoreCase", {
		exportCodeToBeUsed: "$1.toLowerCase().endsWith($2)",
	}],
	// TODO: Shall we add validation for a string?
	// jquery guard: jQuery.sap.assert(typeof sPadChar === 'string' && sPadChar)
	["padLeft", {
		exportCodeToBeUsed: "$1.padStart($3, $2)",
	}],
	// TODO: Shall we add validation for a string?
	// jquery guard: jQuery.sap.assert(typeof sPadChar === 'string' && sPadChar)
	["padRight", {
		exportCodeToBeUsed: "$1.padEnd($3, $2)",
	}],
	["delayedCall", {
		exportCodeToBeUsed: "window.setTimeout($3.bind($2), $1)",
	}],
	["clearDelayedCall", {
		exportCodeToBeUsed: "window.clearTimeout($1)",
	}],
	["intervalCall", {
		exportCodeToBeUsed: "window.setInterval($3.bind($2), $1)",
	}],
	["clearIntervalCall", {
		exportCodeToBeUsed: "window.clearInterval($1)",
	}],
	["domById", {
		exportCodeToBeUsed: "window.document.getElementById($1)",
	}],
	["isEqualNode", {
		exportCodeToBeUsed: "!!$1?.isEqualNode($2)",
	}],
	["newObject", {
		exportCodeToBeUsed: "Object.create($1 || null)",
	}],
	["getter", {
		exportCodeToBeUsed: "function(value) { return function() { return value; }; }($1)",
	}],
	["inArray", {
		exportCodeToBeUsed: "($2 ? Array.prototype.indexOf.call($2, $1) : -1)",
	}],
	["isArray", {
		exportCodeToBeUsed: "Array.isArray($1)",
	}],
	// https://github.com/SAP/ui5-linter/issues/531
	["device.is.landscape", {
		moduleName: "sap/ui/Device",
		exportNameToBeUsed: "orientation.landscape",
	}],
	["device.is.portrait", {
		moduleName: "sap/ui/Device",
		exportNameToBeUsed: "orientation.portrait",
	}],
	["device.is.desktop", {
		moduleName: "sap/ui/Device",
		exportNameToBeUsed: "system.desktop",
	}],
	["device.is.phone", {
		moduleName: "sap/ui/Device",
		exportNameToBeUsed: "system.phone",
	}],
	["device.is.tablet", {
		moduleName: "sap/ui/Device",
		exportNameToBeUsed: "system.tablet",
	}],
	["device.is.android_phone", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.android && $moduleIdentifier.system.tablet",
	}],
	["device.is.android_tablet", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.android && $moduleIdentifier.system.tablet",
	}],
	["device.is.iphone", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.ios && $moduleIdentifier.system.phone",
	}],
	["device.is.ipad", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.ios && $moduleIdentifier.system.ipad",
	}],

	["os.os", {
		moduleName: "sap/ui/Device",
		exportNameToBeUsed: "os.name",
	}],
	["os.fVersion", { // TODO: Check for collisions. Does not work well
		moduleName: "sap/ui/Device",
		exportNameToBeUsed: "os.version",
	}],
	["os.version", {
		moduleName: "sap/ui/Device",
		exportNameToBeUsed: "os.versionStr",
	}],
	["os.Android", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.name === \"Android\"",
	}],
	["os.bb", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.name === \"bb\"",
	}],
	["os.iOS", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.name === \"iOS\"",
	}],
	["os.winphone", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.name === \"winphone\"",
	}],
	["os.win", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.name === \"win\"",
	}],
	["os.linux", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.name === \"linux\"",
	}],
	["os.mac", {
		moduleName: "sap/ui/Device",
		exportCodeToBeUsed: "$moduleIdentifier.os.name === \"mac\"",
	}],

	// https://github.com/SAP/ui5-linter/issues/589
	// TODO: jQuery.sap.getModulePath() has a second param sSuffix
	// How is this handled in sap.ui.require.toUrl
	["getModulePath", {
		exportCodeToBeUsed: "sap.ui.require.toUrl($1)",
	}],
	// TODO: jQuery.sap.getResourcePath() has a second param sSuffix
	// How is this handled in sap.ui.require.toUrl
	["getResourcePath", {
		exportCodeToBeUsed: "sap.ui.require.toUrl($1)",
	}],
	// https://github.com/SAP/ui5-linter/issues/588
	["registerModulePath", {
		exportCodeToBeUsed: "sap.ui.loader.config({paths: {$1: $2}})",
	}],
	["registerResourcePath", {
		exportCodeToBeUsed: "sap.ui.loader.config({paths: {$1: $2}})",
	}],
	// https://github.com/SAP/ui5-linter/issues/530
	// TODO: Discuss with the team!
	// URLSearchParams returns an api close to getUriParameters.
	// However, there are differences. For example .get() returns always a string | undefined
	// whereas getUriParameters returns a string | string[] | undefined
	["getUriParameters", {
		exportCodeToBeUsed: "new URLSearchParams(window.location.search)",
	}],
	// https://github.com/SAP/ui5-linter/issues/578
	["jQuery.fn.control", {
		moduleName: "sap/ui/core/Element",
		exportCodeToBeUsed: "[$moduleIdentifier.closestTo($1)]",
	}],
]);

export default class FixHintsGenerator {
	constructor(
		private resourcePath: string,
		private ambientModuleCache: AmbientModuleCache
	) {

	}

	getJquerySapFixHints(node: ts.AccessExpression | ts.CallExpression,
		namespace: string | undefined): FixHints | undefined {
		if (!namespace?.startsWith("jQuery")) {
			return undefined;
		}

		let moduleReplacement;
		const jQueryAccessChunks = namespace.substring("jQuery.".length).split(".");
		const jQuerySapAccessChunks = namespace.substring("jQuery.sap.".length).split(".");
		const jQueryFn = namespace.replace(/^jQuery\(.*\)\./g, "jQuery.fn.").split(".");
		while (!moduleReplacement &&
			(jQuerySapAccessChunks.length || jQueryAccessChunks.length || jQueryFn.length)) {
			moduleReplacement = jQuerySapModulesReplacements.get(jQuerySapAccessChunks.join(".")) ??
				jQuerySapModulesReplacements.get(jQueryAccessChunks.join(".")) ??
				jQuerySapModulesReplacements.get(jQueryFn.join("."));

			jQuerySapAccessChunks.pop();
			jQueryAccessChunks.pop();
			jQueryFn.pop();
		}

		if (!moduleReplacement && namespace === "jQuery") {
			moduleReplacement = {
				moduleName: "sap/ui/thirdparty/jquery",
			};
		}

		if (!moduleReplacement) {
			return undefined;
		}

		let exportCodeToBeUsed;
		if (moduleReplacement.exportCodeToBeUsed) {
			let current = node;
			let callExpression;
			while (current && ts.isPropertyAccessExpression(current.parent)) {
				current = current.parent;
			}

			if (ts.isCallExpression(current.parent) &&
			// if a prop is wrapped in a function, then current.parent is the call expression
			// which is wrong. That's why check if parent expression is actually the current node
			// which would ensure that the prop is actually a call expression.
			// i.e. jQuery.sap.functionName(args) vs assert(jQuery.sap.functionName)
				current.parent.expression === current) {
				callExpression = current.parent;
			}
			exportCodeToBeUsed = {
				name: moduleReplacement.exportCodeToBeUsed,
				solutionLength: (current.getEnd() - current.getStart()),
			} as FixHints["exportCodeToBeUsed"];

			if (typeof exportCodeToBeUsed === "object") {
				let args: string[] = [];
				// jQuery(".mySelector" /* args */).functionName()
				if (ts.isCallExpression(node.expression)) {
					args = args.concat(node.expression.arguments.map((arg) => arg.getText()));
				}
				// jQuery.sap.functionName(args)
				if (callExpression) {
					args = args.concat(callExpression.arguments.map((arg) => arg.getText()));
					exportCodeToBeUsed.solutionLength = (callExpression.getEnd() - callExpression.getStart());
				}
				exportCodeToBeUsed.args = args;
			}
		}

		return {...moduleReplacement, exportCodeToBeUsed} as FixHints;
	}

	getFixHints(node: ts.CallExpression | ts.AccessExpression): FixHints | undefined {
		if (!this.isFixable(node)) {
			return undefined;
		}

		const result = this.getImportFromGlobal(node);
		if (!result) {
			return undefined;
		}
		const {fixHints, propertyAccessNode} = result;
		if (
			fixHints.moduleName &&
			(
				this.resourcePath === `/resources/${fixHints.moduleName}.js` ||
				this.resourcePath === `/resources/${fixHints.moduleName}.ts`
			)
		) {
			// Prevent adding imports to the module itself
			return undefined;
		}

		// Check whether the access is conditional / probing / lazy
		fixHints.conditional = isConditionalAccess(propertyAccessNode);

		return fixHints;
	}

	private isFixable(node: ts.CallExpression | ts.AccessExpression): boolean {
		if (ts.isCallExpression(node)) {
			return true;
		}
		if (isGlobalAssignment(node)) {
			return false;
		}
		return true;
	}

	private getImportFromGlobal(
		node: ts.CallExpression | ts.AccessExpression
	): {fixHints: FixHints; propertyAccessNode: ts.Node} | undefined {
		const parts: string[] = [];
		const partNodes: ts.Node[] = [];

		const firstPart = node.expression;
		if (!ts.isIdentifier(firstPart)) {
			return undefined;
		}

		if (firstPart.text !== "window" && firstPart.text !== "globalThis" && firstPart.text !== "self") {
			parts.push(firstPart.text);
			partNodes.push(firstPart);
		}

		let scanNode: ts.Node = node;
		while (ts.isPropertyAccessExpression(scanNode)) {
			if (!ts.isIdentifier(scanNode.name)) {
				throw new Error(
					`Unexpected PropertyAccessExpression node: Expected name to be identifier but got ` +
					ts.SyntaxKind[scanNode.name.kind]);
			}
			parts.push(scanNode.name.text);
			partNodes.push(scanNode);
			scanNode = scanNode.parent;
		}

		let moduleSymbol;
		const searchStack = [...parts];
		let exportName;
		while (!moduleSymbol && searchStack.length) {
			const moduleName = searchStack.join("/");
			moduleSymbol = this.ambientModuleCache.findModuleForName(moduleName);
			if (!moduleSymbol) {
				const libraryModuleName = `${moduleName}/library`;
				moduleSymbol = this.ambientModuleCache.findModuleForName(libraryModuleName);
				if (moduleSymbol) {
					exportName = parts[searchStack.length];
					if (exportName && !this.isLibraryExportAccess(moduleSymbol, parts.slice(searchStack.length))) {
						return undefined;
					}
					return {
						fixHints: {moduleName: libraryModuleName, propertyAccess: searchStack.join(".")},
						propertyAccessNode: partNodes[searchStack.length - 1],
					};
				}
			}
			if (!moduleSymbol) {
				searchStack.pop();
			}
		}
		if (!searchStack.length) {
			return undefined;
		}
		return {
			fixHints: {moduleName: searchStack.join("/"), propertyAccess: searchStack.join(".")},
			propertyAccessNode: partNodes[searchStack.length - 1],
		};
	}

	private isLibraryExportAccess(moduleSymbol: ts.Symbol, parts: string[]) {
		// Check for access of unknown/private export or a global usage without a corresponding module
		// e.g. when defining a shortcut for a sub-namespace like sap.ui.core.message
		let currentSymbol: ts.Symbol | undefined = moduleSymbol;
		let currentPart;
		while (parts.length) {
			currentPart = parts.shift();
			currentSymbol = currentSymbol.exports?.get(currentPart as ts.__String);
			if (!currentSymbol) {
				return false;
			}
			// Only continue when symbol is a namespace, as only those have exports we want to check for
			if (!(currentSymbol.flags & ts.SymbolFlags.Namespace)) {
				return true;
			}
		}
		return true;
	}
}
