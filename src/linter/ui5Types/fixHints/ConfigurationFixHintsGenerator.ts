import ts from "typescript";
import type {ExportCodeToBeUsed, FixHints} from "./FixHints.js";
import {isExpectedValueExpression} from "../utils/utils.js";
import {getModuleTypeInfo, Ui5TypeInfo, Ui5TypeInfoKind} from "../Ui5TypeInfo.js";

const configurationModulesReplacements = new Map<string, FixHints>([
	// https://github.com/SAP/ui5-linter/issues/620
	["getAccessibility", {
		moduleName: "sap/ui/core/ControlBehavior", exportNameToBeUsed: "isAccessibilityEnabled",
	}],
	["getActiveTerminologies", {
		moduleName: "sap/base/i18n/Localization", exportNameToBeUsed: "getActiveTerminologies",
	}],
	["getAllowlistService", {
		moduleName: "sap/ui/security/Security", exportNameToBeUsed: "getAllowlistService",
	}],
	["getAnimationMode", {
		moduleName: "sap/ui/core/ControlBehavior", exportNameToBeUsed: "getAnimationMode",
	}],
	["getCalendarType", {
		moduleName: "sap/base/i18n/Formatting", exportNameToBeUsed: "getCalendarType",
	}],
	["getCalendarWeekNumbering", {
		moduleName: "sap/base/i18n/Formatting", exportNameToBeUsed: "getCalendarWeekNumbering",
	}],
	["getFrameOptions", {
		moduleName: "sap/ui/security/Security", exportNameToBeUsed: "getFrameOptions",
	}],
	["getLanguage", {
		moduleName: "sap/base/i18n/Localization", exportNameToBeUsed: "getLanguage",
	}],
	["getRTL", {
		moduleName: "sap/base/i18n/Localization", exportNameToBeUsed: "getRTL",
	}],
	["getSAPLogonLanguage", {
		moduleName: "sap/base/i18n/Localization", exportNameToBeUsed: "getSAPLogonLanguage",
	}],
	["getSecurityTokenHandlers", {
		moduleName: "sap/ui/security/Security", exportNameToBeUsed: "getSecurityTokenHandlers",
	}],
	["getTheme", {
		moduleName: "sap/ui/core/Theming", exportNameToBeUsed: "getTheme",
	}],
	["getTimezone", {
		moduleName: "sap/base/i18n/Localization", exportNameToBeUsed: "getTimezone",
	}],
	["getUIDPrefix", {
		moduleName: "sap/ui/base/ManagedObjectMetadata", exportNameToBeUsed: "getUIDPrefix",
	}],
	["getWhitelistService", {
		moduleName: "sap/ui/security/Security", exportNameToBeUsed: "getAllowlistService",
	}],
	["setAnimationMode", {
		moduleName: "sap/ui/core/ControlBehavior", exportNameToBeUsed: "setAnimationMode",
	}],
	["AnimationMode", {
		moduleName: "sap/ui/core/AnimationMode", propertyAccess: "$moduleIdentifier.AnimationMode",
	}],
	["setSecurityTokenHandlers", {
		moduleName: "sap/ui/security/Security", exportNameToBeUsed: "setSecurityTokenHandlers",
	}],

	// TODO: Complex replacements: Old API returns this, but new API returns undefined.
	// setCalendarType()
	// setCalendarWeekNumbering()
	// setFormatLocale()
	// setLanguage()
	// setRTL()
	// setTheme()
	// setTimezone()

	["getLanguageTag", {
		moduleName: "sap/base/i18n/Localization", exportCodeToBeUsed: "$moduleIdentifier.getLanguageTag().toString()",
	}],

	// TODO: Complex replacement: Discuss: Old API returns boolean, new API returns AnimationMode. How to migrate?
	// (-> 2 new module imports) How to setup this map entry?
	// getAnimation()

	["getFormatLocale", {
		moduleName: "sap/base/i18n/Formatting", exportCodeToBeUsed: "$moduleIdentifier.getFormatLocale().toString()",
	}],

	// TODO: Complex replacement:
	// "Configuration.getLocale()" needs to be replaced with "new Locale(Localization.getLanguageTag())".
	// (-> 2 new module imports) How to setup this map entry?
	// getLocale()

	// Migration not possible
	// Old API is sync and new API is async
	// getVersion()
]);

export default class ConfigurationFixHintsGenerator {
	getFixHints(node: ts.CallExpression | ts.AccessExpression, ui5TypeInfo?: Ui5TypeInfo): FixHints | undefined {
		if (!ts.isPropertyAccessExpression(node) || !ui5TypeInfo) {
			return undefined;
		}

		const moduleTypeInfo = getModuleTypeInfo(ui5TypeInfo);
		if (!moduleTypeInfo || moduleTypeInfo.name !== "sap/ui/core/Configuration") {
			return undefined;
		}

		if (
			(ui5TypeInfo.kind !== Ui5TypeInfoKind.Method &&
				ui5TypeInfo.kind !== Ui5TypeInfoKind.Property) ||
				ui5TypeInfo.parent.kind !== Ui5TypeInfoKind.Class ||
				ui5TypeInfo.parent.name !== "Configuration"
		) {
			return undefined;
		}

		const methodName = ui5TypeInfo.name;
		const moduleReplacement = configurationModulesReplacements.get(methodName);
		if (!moduleReplacement) {
			return undefined;
		}

		let exportCodeToBeUsed;
		if (moduleReplacement.exportCodeToBeUsed) {
			exportCodeToBeUsed = {
				name: moduleReplacement.exportCodeToBeUsed,
				// Check whether the return value of the call expression is assigned to a variable,
				// passed to another function or used elsewhere.
				isExpectedValue: isExpectedValueExpression(node),
			} as ExportCodeToBeUsed;

			let callExpression;
			if (ts.isCallExpression(node.parent) &&
				// if a prop is wrapped in a function, then current.parent is the call expression
				// which is wrong. That's why check if parent expression is actually the current node
				// which would ensure that the prop is actually a call expression.
				node.parent.expression === node) {
				callExpression = node.parent;
			}

			// Extract arguments from the call expression
			if (callExpression) {
				exportCodeToBeUsed.args = callExpression.arguments.map((arg) => ({
					value: arg.getText(),
					kind: arg?.kind,
				}));
			}
		}

		return {...moduleReplacement, exportCodeToBeUsed};
	}
}
