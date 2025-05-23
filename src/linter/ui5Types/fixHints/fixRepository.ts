import Fix from "./Fix.js";
import {
	FixTemplate, createAccessExpressionFixTemplate, createCallExpressionFixTemplate,
} from "./TemplateBasedFix.js";

export function getFixTemplateForGlobalAccess(namespace: string): Fix | undefined {
	console.log(namespace);
	return;
}

export function getFixTemplateForCallExpression(moduleName: string, propertyName: string): FixTemplate | undefined {
	const accessPath = [...moduleName.split("."), ...propertyName.split(".")];
	return findFixTemplate(CALL_EXPRESSIONS, accessPath);
}

export function getFixTemplateForAccessExpression(moduleName: string, propertyName: string): FixTemplate | undefined {
	const accessPath = [...moduleName.split("."), ...propertyName.split(".")];
	return findFixTemplate(ACCESS_EXPRESSIONS, accessPath);
}

function findFixTemplate(map: Modules, accessPath: string[]) {
	let entry = map.get(accessPath[0]);
	if (!entry) {
		// Check for collections
		for (const [key, value] of map) {
			if (Array.isArray(key) && key.includes(accessPath[0])) {
				entry = value;
				break;
			}
		}
		if (!entry) {
			return undefined;
		}
	}
	if (entry instanceof Map) {
		// Traverse further
		return findFixTemplate(entry, accessPath.slice(1));
	} else if (entry) {
		// Found a template
		return entry;
	}
}

type FixTemplateHierarchyNode = [string, FixTemplateHierarchyValue] | [string[], FixTemplate];
type FixTemplateHierarchyValue = FixTemplate | FixTemplateHierarchyNode[];
const ACCESS_EXPRESSIONS = mapFromHierarchy([
	["jQuery", [
		["sap", [
			["assert", createAccessExpressionFixTemplate({
				moduleName: "sap/base/assert",
				preferredIdentifier: "assert",
			})],
			[["Level", "LogLevel"], createAccessExpressionFixTemplate({
				moduleName: "sap/base/Log",
				preferredIdentifier: "Log",
			})],
		]],
	]],
]);

const CALL_EXPRESSIONS = mapFromHierarchy([
	["jQuery", [
		["sap", [
			["log", [
				[["debug", "error", "fatal", "info", "trace", "warning"], createCallExpressionFixTemplate({
					moduleName: "sap/base/Log",
					preferredIdentifier: "Log",
					// Log.debug/warn/info/etc returns void, but the legacy jQuery.log.debug was returning this
					mustNotUseReturnValue: true,
				})],
				["getLog", createCallExpressionFixTemplate({
					moduleName: "sap/base/Log",
					preferredIdentifier: "Log",
					// renameExpression: "getLogEntries",
				})],
				["addLogListener", createCallExpressionFixTemplate({
					moduleName: "sap/base/Log",
					preferredIdentifier: "Log",
				})],
				["getLevel", createCallExpressionFixTemplate({
					moduleName: "sap/base/Log",
					preferredIdentifier: "getLevel",
				})],
				["getLogger", createCallExpressionFixTemplate({
					moduleName: "sap/base/Log",
					preferredIdentifier: "getLogger",
				})],
			]],
		]],
	]],
]);

type Modules = Map<string, Modules | FixTemplate>;
function mapFromHierarchy(hierarchy: FixTemplateHierarchyNode[]): Modules {
	const map = new Map<string, Modules | FixTemplate>();
	for (const [key, value] of hierarchy) {
		if (Array.isArray(key)) {
			for (const subKey of key) {
				// If key is an array, the value must be a FixTemplate
				map.set(subKey, value as FixTemplate);
			}
		} else {
			if (Array.isArray(value)) {
				const subMap = mapFromHierarchy(value);
				map.set(key, subMap);
			} else {
				map.set(key, value);
			}
		}
	}
	return map;
}
