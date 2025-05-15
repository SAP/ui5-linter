import ts from "typescript";
import {FixMetadata} from "./FixMetadata.js";
import FixJquerySapLog from "./FixJquerySapLog.js";
import Fix from "./Fix.js";
import {api} from "sap/chart/library";

export function createDeprecatedCallExpressionFix(node: ts.CallExpression) {
	console.log(node);
}

export function createDeprecatedPropertyAccessFix(node: ts.AccessExpression) {
	console.log(node);
}
export function createGlobalPropertyAccessFix(node: ts.AccessExpression) {
	console.log(node);
}

export function createJquerySapCallExpressionFix(node: ts.CallExpression) {
	console.log(node);
}
export function createJquerySapAccessExpressionFix(node: ts.AccessExpression) {
	const parts: string[] = [];
	const partNodes: ts.Node[] = [];
	let isJQueryFnAccess = false;

	const firstPart = node.expression;
	if (!ts.isIdentifier(firstPart)) {
		if (!ts.isCallExpression(firstPart)) {
			return undefined;
		}
		if (ts.isIdentifier(firstPart.expression) &&
			["jQuery", "$"].includes(firstPart.expression.text)) {
			isJQueryFnAccess = true;
		} else {
			return undefined;
		}
	} else {
		if (firstPart.text !== "window" && firstPart.text !== "globalThis" && firstPart.text !== "self") {
			parts.push(firstPart.text);
			partNodes.push(firstPart);
		}
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

	let fix;
	const searchStack = [...parts];
	while (!fix && searchStack.length) {
		if (isJQueryFnAccess) {
			// jQuery.fn.methodName
		} else if (["jQuery", "$"].includes(searchStack[0]) && searchStack[1] === "sap") {
			// TODO: Check all classes

			const apiName = searchStack.slice(2).join(".");
			if (jQuerySapApis.has(apiName) && apiName === "log.debug") {
				let apiNode = partNodes[searchStack.length - 1];
				if (apiNode.parent && ts.isCallExpression(apiNode.parent)) {
					apiNode = apiNode.parent;
				}
				fix = FixJquerySapLog.create(apiNode);
			}
		} else if (["jQuery", "$"].includes(searchStack[0])) {
			if (searchStack.length > 1) {
				// jQuery.methodName
			}
		}
		if (!fix) {
			searchStack.pop();
		}
	}

	return fix;
}

const jQuerySapApis = new Set<string>([
	"assert",
	"log.addLogListener",
	"log.debug",
	"log.error",
	"log.fatal",
	"log.info",
	"log.trace",
	"log.warning",
	"log.getLevel",
	"log.getLog",
	"log.getLogEntries",
	"log.getLogger",
	"log.Level.NONE",
	"log.Level.FATAL",
	"log.Level.ERROR",
	"log.Level.WARNING",
	"log.Level.INFO",
	"log.Level.TRACE",
	"log.Level.ALL",
	"log.Level.DEBUG",
	"log.Level",
	"log.LogLevel",
	"log.logSupportInfo",
	"log.removeLogListener",
	"log.isLoggable",
	"resources",
	"encodeCSS",
	"encodeJS",
	"encodeURL",
	"encodeURLParameters",
	"encodeHTML",
	"encodeXML",
	"addUrlWhitelist",
	"clearUrlWhitelist",
	"getUrlWhitelist",
	"validateUrl",
	"camelCase",
	"charToUpperCase",
	"escapeRegExp",
	"formatMessage",
	"hashCode",
	"hyphen",
	"isStringNFC",
	"arraySymbolDiff",
	"unique",
	"equal",
	"each",
	"forIn",
	"FrameOptions",
	"parseJS",
	"extend",
	"now",
	"properties",
	"uid",
	"Version",
	"syncStyleClass",
	"setObject",
	"containsOrEquals",
	"denormalizeScrollBeginRTL",
	"denormalizeScrollLeftRTL",
	"ownerWindow",
	"scrollbarSize",
	"includeScript",
	"includeStyleSheet",
	"pxToRem",
	"remToPx",
	"checkMouseEnterOrLeave",
	"bindAnyEvent",
	"unbindAnyEvent",
	"ControlEvents",
	"handleF6GroupNavigation",
	"touchEventMode",
	"keycodes",
	"PseudoEvents",
	"disableTouchToMouseHandling",
	"measure.getRequestTimings",
	"measure.setRequestBufferSize",
	"measure.start",
	"measure.add",
	"measure.end",
	"measure.average",
	"measure.clear",
	"measure.filterMeasurements",
	"measure.getAllMeasurements",
	"measure.getMeasurement",
	"measure.pause",
	"measure.resume",
	"measure.getActive",
	"measure.setActive",
	"measure.remove",
	"measure.registerMethod",
	"measure.unregisterMethod",
	"measure.unregisterAllMethods",
	"measure.clearRequestTimings",
	"fesr.setActive",
	"fesr.getActive",
	"fesr.addBusyDuration",
	"interaction.getActive",
	"interaction.setActive",
	"interaction.notifyStepStart",
	"interaction.notifyStepEnd",
	"interaction.notifyEventStart",
	"interaction.notifyScrollEvent",
	"interaction.notifyEventEnd",
	"interaction.setStepComponent",
	"measure.clearInteractionMeasurements",
	"measure.startInteraction",
	"measure.endInteraction",
	"measure.filterInteractionMeasurements",
	"measure.getAllInteractionMeasurements",
	"measure.getPendingInteractionMeasurement",
	"fesr.getCurrentTransactionId",
	"fesr.getRootId",
	"passport.setActive",
	"passport.traceFlags",
	"initMobile",
	"setIcons",
	"setMobileWebAppCapable",
	"storage",
	"storage.Storage",
	"storage.Type.local",
	"storage.Type.session",
	"storage.isSupported",
	"storage.clear",
	"storage.get",
	"storage.getType",
	"storage.put",
	"storage.remove",
	"storage.removeAll",
	"getParseError",
	"parseXML",
	"serializeXML",
	"startsWith",
	"startsWithIgnoreCase",
	"endsWith",
	"endsWithIgnoreCase",
	"padLeft",
	"padRight",
	"domById",
	"isEqualNode",
	"newObject",
	"getter",
	"getModulePath",
	"getResourcePath",
]);
