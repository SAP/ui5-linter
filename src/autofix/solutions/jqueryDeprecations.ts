import ts from "typescript";
import generateSolutionNoGlobals from "./noGlobals.js";
import {RawLintMessage} from "../../linter/LinterContext.js";
import {MESSAGE} from "../../linter/messages.js";
import {ChangeSet, NewModuleDeclarationInfo} from "../autofix.js";

const jQueryModulesReplacements = new Map<string, string>([
	["jQuery/sap/assert", "sap/base/assert"],
	["jQuery/sap/resources", "sap/base/i18n/ResourceBundle"],
	// ["jQuery/sap/log", "sap/base/Log"], // TODO: Partial module
	["jQuery/sap/encodeCSS", "sap/base/security/encodeCSS"],
	["jQuery/sap/encodeJS", "sap/base/security/encodeJS"],
	["jQuery/sap/encodeURL", "sap/base/security/encodeURL"],
	["jQuery/sap/encodeURLParameters", "sap/base/security/encodeURLParameters"],
	// TODO: Check it. Currently does not work. Check nodeInfos
	["jQuery/sap/encodeHTML", "sap/base/security/encodeXML"],
	["jQuery/sap/encodeXML", "sap/base/security/encodeXML"],
	["jQuery/sap/camelCase", "sap/base/strings/camelize"],
	["jQuery/sap/charToUpperCase", "sap/base/strings/capitalize"],
	["jQuery/sap/escapeRegExp", "sap/base/strings/escapeRegExp"],
	["jQuery/sap/formatMessage", "sap/base/strings/formatMessage"],
	["jQuery/sap/hashCode", "sap/base/strings/hash"],
	["jQuery/sap/hyphen", "sap/base/strings/hyphenate"],
	["jQuery/sap/arraySymbolDiff", "sap/base/util/array/diff"],
	["jQuery/sap/unique", "sap/base/util/array/uniqueSort"],
	["jQuery/sap/equal", "sap/base/util/deepEqual"],
	["jQuery/sap/each", "sap/base/util/each"],
	["jQuery/sap/forIn", "sap/base/util/each"],
	["jQuery/isPlainObject", "sap/base/util/isPlainObject"],
	["jQuery/sap/FrameOptions", "sap/ui/security/FrameOptions"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/529
	["jQuery/sap/parseJS", "sap/base/util/JSTokenizer"],
	["jQuery/sap/extend", "sap/base/util/merge"],
	// TODO: Replace with native window.performance.now()
	// ["jQuery.sap.now", ""],
	["jQuery/sap/properties", "sap/base/util/Properties"],
	["jQuery/sap/uid", "sap/base/util/uid"],
	["jQuery/sap/Version", "sap/base/util/Version"],
	["jQuery/sap/syncStyleClass", "sap/ui/core/syncStyleClass"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/529
	["jQuery/sap/setObject", "sap/base/util/ObjectPath"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/529
	["jQuery/sap/getObject", "sap/base/util/ObjectPath"],
	["jQuery/sap/containsOrEquals", "sap/ui/dom/containsOrEquals"],
	["jQuery/sap/denormalizeScrollBeginRTL", "sap/ui/dom/denormalizeScrollBeginRTL"],
	["jQuery/sap/denormalizeScrollLeftRTL", "sap/ui/dom/denormalizeScrollLeftRTL"],
	["jQuery/sap/ownerWindow", "sap/ui/dom/getOwnerWindow"],
	["jQuery/sap/scrollbarSize", "sap/ui/dom/getScrollbarSize"],
	["jQuery/sap/includeScript", "sap/ui/dom/includeScript"],
	["jQuery/sap/includeStylesheet", "sap/ui/dom/includeStylesheet"],
	["jQuery/sap/replaceDOM", "sap/ui/dom/patch"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/542
	["jQuery/sap/pxToRem", "sap/ui/dom/units/Rem"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/542
	["jQuery/sap/remToPx", "sap/ui/dom/units/Rem"],
	["jQuery/sap/checkMouseEnterOrLeave", "sap/ui/events/checkMouseEnterOrLeave"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	["jQuery/sap/bindAnyEvent", "sap/ui/events/ControlEvents"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	["jQuery/sap/unbindAnyEvent", "sap/ui/events/ControlEvents"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	["jQuery/sap/ControlEvents", "sap/ui/events/ControlEvents"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	["jQuery/sap/handleF6GroupNavigation", "sap/ui/events/F6Navigation"],
	["jQuery/sap/isMouseEventDelayed", "sap/ui/events/isMouseEventDelayed"],
	["jQuery/sap/isSpecialKey", "sap/ui/events/isSpecialKey"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	["jQuery/sap/touchEventMode", "sap/ui/events/jquery/EventSimulation"],
	// TODO: Might not work out of the box
	["jQuery/sap/keycodes", "sap/ui/events/KeyCodes"],
	// TODO: Might not work out of the box
	["jQuery/sap/PseudoEvents", "sap/ui/events/PseudoEvents"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/543
	["jQuery/sap/disableTouchToMouseHandling", "sap/ui/events/TouchToMouseMapping"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/start", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/add", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/end", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/average", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/clear", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/filterMeasurements", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/getAllMeasurements", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/getMeasurement", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/pause", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/resume", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/getActive", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/setActive", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/remove", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/registerMethod", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/unregisterMethod", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/555
	["jQuery/sap/measure/unregisterAllMethods", "sap/ui/performance/Measurement"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/fesr/setActive", "sap/ui/performance/trace/FESR"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/fesr/getActive", "sap/ui/performance/trace/FESR"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/fesr/addBusyDuration", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/interaction/getActive", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/interaction/setActive", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/interaction/notifyStepStart", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/interaction/notifyStepEnd", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/interaction/notifyEventStart", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/interaction/notifyScrollEvent", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/interaction/notifyEventEnd", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/interaction/setStepComponent", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/measure/clearInteractionMeasurements", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/measure/startInteraction", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/measure/endInteraction", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/measure/filterInteractionMeasurements", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/measure/getAllInteractionMeasurements", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/measure/getPendingInteractionMeasurement", "sap/ui/performance/trace/Interaction"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/fesr/getCurrentTransactionId", "sap/ui/performance/trace/Passport"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/fesr/getRootId", "sap/ui/performance/trace/Passport"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/passport/setActive", "sap/ui/performance/trace/Passport"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/561
	["jQuery/sap/passport/traceFlags", "sap/ui/performance/trace/Passport"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	["jQuery/sap/act", "sap/ui/util/ActivityDetection"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	["jQuery/sap/initMobile", "sap/ui/util/Mobile"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	["jQuery/sap/setIcons", "sap/ui/util/Mobile"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	["jQuery/sap/setMobileWebAppCapable", "sap/ui/util/Mobile"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	["jQuery/sap/storage", "sap/ui/util/Storage"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	["jQuery/sap/getParseError", "sap/ui/util/XMLHelper"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	["jQuery/sap/parseXML", "sap/ui/util/XMLHelper"],
	// TODO: Won't work out of the box. Requires additional changes. Check the example: https://github.com/SAP/ui5-linter/issues/563
	["jQuery/sap/serializeXML", "sap/ui/util/XMLHelper"],
]);

function getOriginalKey(key: string) {
	const originalKeys = Array.from(jQueryModulesReplacements.keys());
	return originalKeys.find((originalKey) => {
		const keyChunks = key.split("/");
		while (keyChunks.length > 0) {
			if (originalKey === keyChunks.join("/")) {
				return originalKey;
			}
			keyChunks.pop();
		}
	});
}

export default function generateSolutionJQueryDeprecations(
	checker: ts.TypeChecker, sourceFile: ts.SourceFile, content: string,
	messages: RawLintMessage<MESSAGE.DEPRECATED_API_ACCESS>[],
	changeSet: ChangeSet[], newModuleDeclarations: NewModuleDeclarationInfo[]
) {
	// TODO: Fix type info
	// TODO: Validate if jQuery is included as dependency
	// TODO: Remove unmatched imports
	const moduleImports = generateSolutionNoGlobals(
		checker, sourceFile, content, messages, changeSet, newModuleDeclarations);

	for (const [moduleImportsKey, {importRequests}] of moduleImports) {
		for (const [key, {nodeInfos}] of importRequests) {
			const baseKey = getOriginalKey(key);
			if (baseKey) {
				const newKey = jQueryModulesReplacements.get(baseKey);
				if (newKey) {
					nodeInfos.forEach((nodeInfo) => {
						const lastNodeText = baseKey.split("/").pop();
						let node = nodeInfo.node;
						while (node && node.name.getText() !== lastNodeText) {
							node = node.expression;
						}
						nodeInfo.node = node;
					});
					const existingNodeInfos = importRequests.get(newKey) ?? {nodeInfos: []};
					existingNodeInfos.nodeInfos.push(...nodeInfos);
					importRequests.set(newKey, existingNodeInfos);
					importRequests.delete(key);
				}
			}
		}

		if (importRequests.size === 0) {
			moduleImports.delete(moduleImportsKey);
			continue;
		}
	}

	return moduleImports;
}
