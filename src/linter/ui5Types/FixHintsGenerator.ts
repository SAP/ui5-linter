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
		moduleName: "sap/base/Log",
	}],
	["log.addLogListener", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "addLogListener",
	}],
	["log.debug", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "debug",
	}],
	["log.error", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "error",
	}],
	["log.fatal", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "fatal",
	}],
	["log.getLevel", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "getLevel",
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
	["log.info", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "info",
	}],
	["log.Level", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "Level",
	}],
	["log.logSupportInfo", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "logSupportInfo",
	}],
	["log.removeLogListener", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "removeLogListener",
	}],
	["log.trace", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "trace",
	}],
	["log.warning", {
		moduleName: "sap/base/Log", exportNameToBeUsed: "warning",
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
		moduleName: "sap/base/security/URLListValidator", exportNameToBeUsed: "add",
	}],
	["removeUrlWhitelist", {
		moduleName: "sap/base/security/URLListValidator",
		exportCodeToBeUsed: `var aCurrentEntries = $moduleIdentifier.entries();
aCurrentEntries.splice($1, 1);
$moduleIdentifier.clear();
aCurrentEntries.forEach(({protocol, host, port, path}) => $moduleIdentifier.add(protocol, host, port, path))`,
	}],

	// https://github.com/SAP/ui5-linter/issues/527
	["camelCase", {
		moduleName: "sap/base/strings/camelize",
	}],
	["charToUpperCase", {
		moduleName: "sap/base/strings/capitalize",
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
	["isPlainObject", {
		moduleName: "sap/base/util/isPlainObject",
	}],
	["FrameOptions", {
		moduleName: "sap/ui/security/FrameOptions",
	}],
	["parseJS", {
		moduleName: "sap/base/util/JSTokenizer", exportNameToBeUsed: "parseJS",
	}],
	["extend", {
		moduleName: "sap/base/util/merge",
	}],
	["now", { // TODO: Check: not working
		exportCodeToBeUsed: "window.performance.now",
	}],
	["properties", {
		moduleName: "sap/base/util/Properties",
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
		moduleName: "sap/base/util/ObjectPath", exportNameToBeUsed: "set",
	}],
	["getObject", {
		moduleName: "sap/base/util/ObjectPath", exportNameToBeUsed: "get",
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
		moduleName: "sap/ui/events/isMouseEventDelayed",
	}],
	["isSpecialKey", {
		moduleName: "sap/ui/events/isSpecialKey",
	}],
	["touchEventMode", {
		moduleName: "sap/ui/events/jquery/EventSimulation", exportNameToBeUsed: "touchEventMode",
	}],
	["keycodes", {
		moduleName: "sap/ui/events/KeyCodes",
	}],
	["PseudoEvents", {
		moduleName: "sap/ui/events/PseudoEvents",
	}],
	["disableTouchToMouseHandling", {
		moduleName: "sap/ui/events/TouchToMouseMapping", exportNameToBeUsed: "disableTouchToMouseHandling",
	}],
	// https://github.com/SAP/ui5-linter/issues/555
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
	["act", {
		moduleName: "sap/ui/util/ActivityDetection",
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
	// TODO: Check how to append "new"
	// ["storage", {
	// 	moduleName: "sap/ui/util/Storage", exportNameToBeUsed: "traceFlags",
	// }],
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
	["startsWith", {
		exportCodeToBeUsed: "$1.startsWith($2)",
	}],
	["startsWithIgnoreCase", {
		exportCodeToBeUsed: "$1.toLowerCase().startsWith($2)",
	}],
	["endsWith", {
		exportCodeToBeUsed: "$1.endsWith($2)",
	}],
	["endsWithIgnoreCase", {
		exportCodeToBeUsed: "$1.toLowerCase().endsWith($2)",
	}],
	["padLeft", {
		exportCodeToBeUsed: "$1.padStart($3, $2)",
	}],
	["padRight", {
		exportCodeToBeUsed: "$1.padEnd($3, $2)",
	}],
	["delayedCall", {
		exportCodeToBeUsed: "window.setTimeout($2[$3], $1, ...$4)",
	}],
	["clearDelayedCall", {
		exportCodeToBeUsed: "window.clearTimeout($1)",
	}],
	["intervalCall", {
		exportCodeToBeUsed: "window.setInterval($2[$3], $1, ...$4)",
	}],
	["clearIntervalCall", {
		exportCodeToBeUsed: "window.clearInterval($1)",
	}],
	["domById", {
		exportCodeToBeUsed: "window.document.getElementById($1)",
	}],
	["isEqualNode", {
		exportCodeToBeUsed: "$1.isEqualNode($2)",
	}],
	["newObject", {
		exportCodeToBeUsed: "structuredClone($1)",
	}],
	["getter", {
		exportCodeToBeUsed: "function(value) { return function() { return value; }; }($1)",
	}],
	["inArray", {
		exportCodeToBeUsed: "($2 ?? Array.prototype.indexOf.call($2, $1) : -1)",
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
	["getModulePath", {
		exportCodeToBeUsed: "sap.ui.require.toUrl($1)",
	}],
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
	["getUriParameters", {
		exportCodeToBeUsed: "new URLSearchParams(window.location.search)",
	}],
]);

export default class FixHintsGenerator {
	constructor(
		private resourcePath: string,
		private ambientModuleCache: AmbientModuleCache
	) {

	}

	getJquerySapFixHints(node: ts.AccessExpression, namespace: string | undefined): FixHints | undefined {
		if (!namespace?.startsWith("jQuery.")) {
			return undefined;
		}
		const jQueryAccess = namespace.substring("jQuery.".length);
		const jQuerySapAccess = namespace.substring("jQuery.sap.".length);
		const moduleReplacement = jQuerySapModulesReplacements.get(jQuerySapAccess) ??
			jQuerySapModulesReplacements.get(jQueryAccess);
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
			if (ts.isCallExpression(current.parent)) {
				callExpression = current.parent;
			}
			exportCodeToBeUsed = {
				name: moduleReplacement.exportCodeToBeUsed,
				solutionLength: (current.getEnd() - current.getStart()),
			} as FixHints["exportCodeToBeUsed"];
			if (callExpression &&
				typeof exportCodeToBeUsed === "object") {
				exportCodeToBeUsed.args = callExpression.arguments.map((arg) => arg.getText());
				exportCodeToBeUsed.solutionLength = (callExpression.getEnd() - callExpression.getStart());
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
