import ts from "typescript";
import type {ExportCodeToBeUsed, FixHints} from "./FixHints.js";
import {isExpectedValueExpression, Ui5TypeInfoKind} from "../utils/utils.js";
import {AmbientModuleCache} from "../AmbientModuleCache.js";
import type {Ui5TypeInfo} from "../utils/utils.js";

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
	["setSecurityTokenHandlers", {
		moduleName: "sap/ui/security/Security", exportNameToBeUsed: "setSecurityTokenHandlers",
	}],

	// TODO: MR: Discuss: Old API returns this, but new API returns undefined. Is this problematic?
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
	// TODO:
	// getAnimation() //TODO: MR: Discuss: Old API returns boolean, new API returns AnimationMode. How to migrate?
	// getFormatLocale()
	// getLocale() //TODO: MR: Discuss:
	// 			"Configuration.getLocale()" needs to be replaced with "new Locale(Localization.getLanguageTag())".
	//			(-> 2 new module imports) How to setup this map entry?
	// getVersion() //TODO: MR: Discuss: New API needs wrapper around the replacement

]);

export default class ConfigurationFixHintsGenerator {
	getFixHints(node: ts.CallExpression | ts.AccessExpression, ui5TypeInfo?: Ui5TypeInfo): FixHints | undefined {
	}
}
