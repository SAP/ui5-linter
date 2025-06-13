import ts from "typescript";
import Ui5TypeInfoMatcher from "../../Ui5TypeInfoMatcher.js";
import {
	FixTypeInfoMatcher,
	accessExpressionFix,
	callExpressionFix,
	callExpressionGeneratorFix,
} from "../FixFactory.js";
import {FixScope} from "../BaseFix.js";

const t: FixTypeInfoMatcher = new Ui5TypeInfoMatcher("sap.ui.core");
export default t;

t.declareModule("sap/ui/core/Configuration", [
	t.class("Configuration", [
		t.method("getAccessibility", accessExpressionFix({
			moduleName: "sap/ui/core/ControlBehavior",
			propertyAccess: "isAccessibilityEnabled",
		})),
		t.method("getActiveTerminologies", accessExpressionFix({
			moduleName: "sap/base/i18n/Localization",
			propertyAccess: "getActiveTerminologies",
		})),
		t.method("getAnimation", callExpressionFix({
			moduleName: "sap/ui/core/ControlBehavior",
			propertyAccess: "getAnimationMode",
			// Note: The new API returns an enum value instead of a boolean, therefore
			// migration is currently not possible if the return value is used
			// This could be optimized with an advanced migration that detects how the return
			// value is used and e.g. migrates to something like
			// (getAnimationMode() !== sap.ui.core.Configuration.AnimationMode.none)
			// Right now this migration probably wont apply for most cases
			mustNotUseReturnValue: true,
		})),
		t.method("getAnimationMode", accessExpressionFix({
			scope: FixScope.FirstChild,
			moduleName: "sap/ui/core/ControlBehavior",
		})),
		t.method("getAllowlistService", accessExpressionFix({
			moduleName: "sap/ui/security/Security",
			propertyAccess: "getAllowlistService",
		})),
		t.method("getCalendarType", accessExpressionFix({
			moduleName: "sap/base/i18n/Formatting",
			propertyAccess: "getCalendarType",
		})),
		t.method("getCalendarWeekNumbering", accessExpressionFix({
			moduleName: "sap/base/i18n/Formatting",
			propertyAccess: "getCalendarWeekNumbering",
		})),
		t.method("getFrameOptions", accessExpressionFix({
			moduleName: "sap/ui/security/Security",
			propertyAccess: "getFrameOptions",
		})),
		t.method("getFormatLocale", callExpressionGeneratorFix({
			moduleName: "sap/base/i18n/Formatting",
			generator: (ctx, moduleIdentifier) => {
				return `${moduleIdentifier}.getLanguageTag().toString()`;
			},
		})),
		t.method("getLanguage", accessExpressionFix({
			moduleName: "sap/base/i18n/Localization",
			propertyAccess: "getLanguage",
		})),
		t.method("getLanguageTag", callExpressionGeneratorFix({
			moduleName: "sap/base/i18n/Localization",
			generator: (ctx, moduleIdentifier) => {
				return `${moduleIdentifier}.getLanguageTag().toString()`;
			},
		})),
		t.method("getRTL", accessExpressionFix({
			moduleName: "sap/base/i18n/Localization",
			propertyAccess: "getRTL",
		})),
		t.method("getSAPLogonLanguage", accessExpressionFix({
			moduleName: "sap/base/i18n/Localization",
			propertyAccess: "getSAPLogonLanguage",
		})),
		t.method("getSecurityTokenHandlers", accessExpressionFix({
			moduleName: "sap/ui/security/Security",
			propertyAccess: "getSecurityTokenHandlers",
		})),
		t.method("getTheme", accessExpressionFix({
			moduleName: "sap/ui/core/Theming",
			propertyAccess: "getTheme",
		})),
		t.method("getTimezone", accessExpressionFix({
			moduleName: "sap/base/i18n/Localization",
			propertyAccess: "getTimezone",
		})),
		t.method("getUIDPrefix", accessExpressionFix({
			moduleName: "sap/ui/base/ManagedObjectMetadata",
			propertyAccess: "getUIDPrefix",
		})),
		t.method("getWhitelistService", accessExpressionFix({
			moduleName: "sap/ui/security/Security",
			propertyAccess: "getAllowlistService",
		})),
		t.method("setAnimationMode", accessExpressionFix({
			moduleName: "sap/ui/core/ControlBehavior",
			propertyAccess: "setAnimationMode",
		})),
		t.method("setSecurityTokenHandlers", accessExpressionFix({
			moduleName: "sap/ui/security/Security",
			propertyAccess: "setSecurityTokenHandlers",
		})),
		...t.methods(["setRTL", "setLanguage"], callExpressionFix({
			scope: FixScope.FirstChild,
			moduleName: "sap/base/i18n/Localization",
			mustNotUseReturnValue: true,
		})),

		// TODO: Complex replacements: Old API returns this, but new API returns undefined.
		// setCalendarType()
		// setCalendarWeekNumbering()
		// setFormatLocale()
		// setLanguage()
		// setRTL()
		// setTheme()
		// setTimezone()
	]),
]);
t.declareModule("sap/ui/core/Core", [
	t.class("Core", [
		...t.methods(["attachInit", "attachInitEvent"], accessExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/Core",
			propertyAccess: "ready",
		})),
		...t.methods(["getControl", "getElementById", "byId"], accessExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/Element",
			propertyAccess: "getElementById",
		})),
		t.method("getEventBus", accessExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/EventBus",
			propertyAccess: "getInstance",
		})),
		t.method("getConfiguration", callExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/Configuration",
		})),
		t.method("getStaticAreaRef", accessExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/StaticArea",
			propertyAccess: "getDomRef",
		})),
		t.method("initLibrary", accessExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/Lib",
			propertyAccess: "init",
		})),
		t.method("isMobile", callExpressionGeneratorFix({
			moduleName: "sap/ui/Device",
			generator: (ctx, moduleIdentifier) => {
				return `${moduleIdentifier}.browser.mobile`;
			},
		})),
		t.method("notifyContentDensityChanged", accessExpressionFix({
			scope: FixScope.FirstChild,
			moduleName: "sap/ui/core/Theming",
		})),
		t.method("getCurrentFocusedControlId", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/Element",
			// The legacy API used to return null if no control was focused.
			generator: (ctx, moduleIdentifier) => {
				return `${moduleIdentifier}.getActiveElement()?.getId() || null`;
			},
		})),
		t.method("byFieldGroupId", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/Control",
			generator: (ctx, moduleIdentifier, arg1) => {
				return `${moduleIdentifier}.getControlsByFieldGroupId(${arg1})`;
			},
		})),
		t.method("isStaticAreaRef", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/StaticArea",
			generator: (ctx, moduleIdentifier, arg1) => {
				return `${moduleIdentifier}.getDomRef() === ${arg1}`;
			},
		})),
		t.method("applyTheme", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/Theming",
			validateArguments: (ctx, checker, arg1, arg2) => {
				// Migrate only if second argument is omitted or undefined
				if (!arg2 || (ts.isIdentifier(arg2) && arg2.text === "undefined")) {
					return true;
				}
				return false;
			},
			generator: (ctx, moduleIdentifier, arg1) => {
				return `${moduleIdentifier}.setTheme(${arg1})`;
			},
		})),
		t.method("getComponent", accessExpressionFix({
			moduleName: "sap/ui/core/Component",
			propertyAccess: "getComponentById",
		})),
	]),
]);
