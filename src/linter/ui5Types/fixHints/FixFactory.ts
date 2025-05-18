import ts from "typescript";
import Fix, {ConstrainViolation} from "./Fix.js";
import {getFixTemplateForAccessExpression, getFixTemplateForCallExpression} from "./fixRepository.js";
import {FixTemplate, TEMPLATE_ID} from "./TemplateBasedFix.js";
import CallExpressionFix, {CallExpressionFixTemplate} from "./templates/CallExpressionFix.js";
import AccessExpressionFix, {AccessExpressionFixTemplate} from "./templates/AccessExpressionFix.js";
import {PositionInfo} from "../../LinterContext.js";

export function createGlobalPropertyAccessFix(node: ts.AccessExpression, position: PositionInfo): Fix | undefined {
	console.log(node);
	return;
}

export function createDeprecatedCallExpressionFix(node: ts.CallExpression, position: PositionInfo): Fix | undefined {
	console.log(node);
	return;
}

export function createDeprecatedPropertyAccessFix(node: ts.AccessExpression, position: PositionInfo): Fix | undefined {
	console.log(node);
	return;
}

export function createJquerySapCallExpressionFix(node: ts.CallExpression, position: PositionInfo): Fix | undefined {
	console.log(node);
	return;
}

export function createJquerySapAccessExpressionFix(node: ts.AccessExpression, position: PositionInfo): Fix | undefined {
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
			// jQuery.sap.methodName or jQuery.sap.moduleName.methodName or jQuery.sap.moduleName.propertyName
			const apiName = searchStack.slice(2).join(".");
			const apiNode = partNodes[searchStack.length - 1];
			if (apiNode.parent) {
				// First try using the parent (e.g. CallExpression)
				fix = getFix(apiNode.parent, position, "jQuery.sap", apiName);
			}
			// If that fails, try using the current node (e.g. PropertyAccessExpression)
			fix ??= getFix(apiNode, position, "jQuery.sap", apiName);
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

function getFix(node: ts.Node, position: PositionInfo, moduleName: string, apiName: string): Fix | undefined {
	let template;
	if (ts.isCallExpression(node)) {
		template = getFixTemplateForCallExpression(moduleName, apiName);
	} else if (ts.isPropertyAccessExpression(node)) {
		template = getFixTemplateForAccessExpression(moduleName, apiName);
	}
	if (template) {
		const fix = getFixForTemplate(node, template);
		try {
			fix.setInitialContext(node, position);
			return fix;
		} catch (err) {
			if (err instanceof ConstrainViolation) {
				// Fix is not compatible
				return;
			}
			throw err;
		}
	}
}

function getFixForTemplate(node: ts.Node, template: FixTemplate) {
	// TODO: Make SourceFileReporter#addMessage async and load fix class dynamically here
	switch (template.id) {
		case TEMPLATE_ID.CALL_EXPRESSION:
			return new CallExpressionFix(template as CallExpressionFixTemplate);
		case TEMPLATE_ID.ACCESS_EXPRESSION:
			return new AccessExpressionFix(template as AccessExpressionFixTemplate);
	}
}

/*
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
*/