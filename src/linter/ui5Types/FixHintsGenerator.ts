import ts from "typescript";
import {AmbientModuleCache} from "./AmbientModuleCache.js";
import {isConditionalAccess, isGlobalAssignment} from "./utils/utils.js";

export interface FixHints {
	moduleName?: string;
	exportName?: string;
	propertyAccess?: string;
	conditional?: boolean;
}

const jQuerySapModulesReplacements = new Map<string, string>([
	["assert", "sap/base/assert"],

	// ["jQuery/sap/resources", "sap/base/i18n/ResourceBundle"],
	// ["jQuery/sap/log", "sap/base/Log"],
	// ["jQuery/sap/encodeCSS", "sap/base/security/encodeCSS"],
	// ["jQuery/sap/encodeJS", "sap/base/security/encodeJS"],
	// ["jQuery/sap/encodeURL", "sap/base/security/encodeURL"],
	// ["jQuery/sap/encodeURLParameters", "sap/base/security/encodeURLParameters"],
	// ["jQuery/sap/encodeHTML", "sap/base/security/encodeXML"],
	// ["jQuery/sap/encodeXML", "sap/base/security/encodeXML"],
	// ["jQuery/sap/camelCase", "sap/base/strings/camelize"],
	// ["jQuery/sap/charToUpperCase", "sap/base/strings/capitalize"],
	// ["jQuery/sap/escapeRegExp", "sap/base/strings/escapeRegExp"],
	// ["jQuery/sap/formatMessage", "sap/base/strings/formatMessage"],
	// ["jQuery/sap/hashCode", "sap/base/strings/hash"],
	// ["jQuery/sap/hyphen", "sap/base/strings/hyphenate"],
	// ["jQuery/sap/arraySymbolDiff", "sap/base/util/array/diff"],
	// ["jQuery/sap/unique", "sap/base/util/array/uniqueSort"],
	// ["jQuery/sap/equal", "sap/base/util/deepEqual"],
	// ["jQuery/sap/each", "sap/base/util/each"],
	// ["jQuery/sap/forIn", "sap/base/util/each"],
	// ["jQuery/isPlainObject", "sap/base/util/isPlainObject"],
	// ["jQuery/sap/FrameOptions", "sap/ui/security/FrameOptions"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/529
	// ["jQuery/sap/parseJS", "sap/base/util/JSTokenizer"],
	// ["jQuery/sap/extend", "sap/base/util/merge"],
	// // TODO: Replace with native window.performance.now()
	// // ["jQuery.sap.now", ""],
	// ["jQuery/sap/properties", "sap/base/util/Properties"],
	// ["jQuery/sap/uid", "sap/base/util/uid"],
	// ["jQuery/sap/Version", "sap/base/util/Version"],
	// ["jQuery/sap/syncStyleClass", "sap/ui/core/syncStyleClass"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/529
	// ["jQuery/sap/setObject", "sap/base/util/ObjectPath"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/529
	// ["jQuery/sap/getObject", "sap/base/util/ObjectPath"],
	// ["jQuery/sap/containsOrEquals", "sap/ui/dom/containsOrEquals"],
	// ["jQuery/sap/denormalizeScrollBeginRTL", "sap/ui/dom/denormalizeScrollBeginRTL"],
	// ["jQuery/sap/denormalizeScrollLeftRTL", "sap/ui/dom/denormalizeScrollLeftRTL"],
	// ["jQuery/sap/ownerWindow", "sap/ui/dom/getOwnerWindow"],
	// ["jQuery/sap/scrollbarSize", "sap/ui/dom/getScrollbarSize"],
	// ["jQuery/sap/includeScript", "sap/ui/dom/includeScript"],
	// ["jQuery/sap/includeStylesheet", "sap/ui/dom/includeStylesheet"],
	// ["jQuery/sap/replaceDOM", "sap/ui/dom/patch"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/542
	// ["jQuery/sap/pxToRem", "sap/ui/dom/units/Rem"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/542
	// ["jQuery/sap/remToPx", "sap/ui/dom/units/Rem"],
	// ["jQuery/sap/checkMouseEnterOrLeave", "sap/ui/events/checkMouseEnterOrLeave"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	// ["jQuery/sap/bindAnyEvent", "sap/ui/events/ControlEvents"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	// ["jQuery/sap/unbindAnyEvent", "sap/ui/events/ControlEvents"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	// ["jQuery/sap/ControlEvents", "sap/ui/events/ControlEvents"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	// ["jQuery/sap/handleF6GroupNavigation", "sap/ui/events/F6Navigation"],
	// ["jQuery/sap/isMouseEventDelayed", "sap/ui/events/isMouseEventDelayed"],
	// ["jQuery/sap/isSpecialKey", "sap/ui/events/isSpecialKey"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	// ["jQuery/sap/touchEventMode", "sap/ui/events/jquery/EventSimulation"],
	// // TODO: Might not work out of the box
	// ["jQuery/sap/keycodes", "sap/ui/events/KeyCodes"],
	// // TODO: Might not work out of the box
	// ["jQuery/sap/PseudoEvents", "sap/ui/events/PseudoEvents"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	// ["jQuery/sap/disableTouchToMouseHandling", "sap/ui/events/TouchToMouseMapping"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/start", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/add", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/end", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/average", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/clear", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/filterMeasurements", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/getAllMeasurements", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/getMeasurement", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/pause", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/resume", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/getActive", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/setActive", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/remove", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/registerMethod", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/unregisterMethod", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	// ["jQuery/sap/measure/unregisterAllMethods", "sap/ui/performance/Measurement"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/fesr/setActive", "sap/ui/performance/trace/FESR"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/fesr/getActive", "sap/ui/performance/trace/FESR"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/fesr/addBusyDuration", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/interaction/getActive", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/interaction/setActive", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/interaction/notifyStepStart", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/interaction/notifyStepEnd", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/interaction/notifyEventStart", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/interaction/notifyScrollEvent", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/interaction/notifyEventEnd", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/interaction/setStepComponent", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/measure/clearInteractionMeasurements", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/measure/startInteraction", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/measure/endInteraction", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/measure/filterInteractionMeasurements", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/measure/getAllInteractionMeasurements", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/measure/getPendingInteractionMeasurement", "sap/ui/performance/trace/Interaction"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/fesr/getCurrentTransactionId", "sap/ui/performance/trace/Passport"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/fesr/getRootId", "sap/ui/performance/trace/Passport"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/passport/setActive", "sap/ui/performance/trace/Passport"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	// ["jQuery/sap/passport/traceFlags", "sap/ui/performance/trace/Passport"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	// ["jQuery/sap/act", "sap/ui/util/ActivityDetection"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	// ["jQuery/sap/initMobile", "sap/ui/util/Mobile"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	// ["jQuery/sap/setIcons", "sap/ui/util/Mobile"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	// ["jQuery/sap/setMobileWebAppCapable", "sap/ui/util/Mobile"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	// ["jQuery/sap/storage", "sap/ui/util/Storage"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	// ["jQuery/sap/getParseError", "sap/ui/util/XMLHelper"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	// ["jQuery/sap/parseXML", "sap/ui/util/XMLHelper"],
	// // TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	// ["jQuery/sap/serializeXML", "sap/ui/util/XMLHelper"],
]);

export default class FixHintsGenerator {
	constructor(
		private resourcePath: string,
		private ambientModuleCache: AmbientModuleCache
	) {

	}

	getJquerySapFixHints(node: ts.AccessExpression, namespace: string | undefined): FixHints | undefined {
		if (!namespace?.startsWith("jQuery.sap.")) {
			return undefined;
		}
		const jQuerySapAccess = namespace.substring("jQuery.sap.".length);
		const moduleReplacement = jQuerySapModulesReplacements.get(jQuerySapAccess);
		if (!moduleReplacement) {
			return undefined;
		}
		return {
			moduleName: moduleReplacement,
		};
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
						fixHints: {moduleName: libraryModuleName, exportName, propertyAccess: searchStack.join(".")},
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
			fixHints: {moduleName: searchStack.join("/"), exportName, propertyAccess: searchStack.join(".")},
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
