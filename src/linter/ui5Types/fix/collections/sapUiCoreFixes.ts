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
		...t.methods(["setRTL", "setLanguage"], callExpressionFix({
			scope: FixScope.SecondChild,
			moduleName: "sap/base/i18n/Localization",
			mustNotUseReturnValue: true,
		})),
		t.method("getLocale", callExpressionGeneratorFix({
			moduleImports: [{
				moduleName: "sap/ui/core/Locale",
			}, {
				moduleName: "sap/base/i18n/Localization",
			}],
			generator(ctx, identifierNames) {
				return `new ${identifierNames[0]}(${identifierNames[1]}.getLanguageTag())`;
			},
		})),
	]),
]);

t.declareModule("sap/ui/core/Core", [
	t.class("Core", [
		// Core.attachInit|attachInitEvent => Core.ready
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
		// Core.getEventBus => EventBus.getInstance
		t.method("getEventBus", accessExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/EventBus",
			propertyAccess: "getInstance",
		})),
		// Core.getConfiguration() => Configuration
		t.method("getConfiguration", callExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/Configuration",
		})),
		// Core.getStaticAreaRef => StaticArea.getDomRef
		t.method("getStaticAreaRef", accessExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/StaticArea",
			propertyAccess: "getDomRef",
		})),
		// Core.initLibrary => Lib.init
		t.method("initLibrary", accessExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/Lib",
			propertyAccess: "init",
		})),
		// Core.isMobile() => Device.browser.mobile
		t.method("isMobile", callExpressionGeneratorFix({
			moduleName: "sap/ui/Device",
			generator: (ctx, [moduleIdentifier]) => {
				return `${moduleIdentifier}.browser.mobile`;
			},
		})),
		// Core.notifyContentDensityChanged => Theming.notifyContentDensityChanged
		t.method("notifyContentDensityChanged", accessExpressionFix({
			scope: FixScope.FirstChild,
			moduleName: "sap/ui/core/Theming",
		})),
		// Core.getCurrentFocusedControlId => Element.getActiveElement()?.getId() || null
		t.method("getCurrentFocusedControlId", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/Element",
			// The legacy API used to return null if no control was focused.
			generator: (ctx, [moduleIdentifier]) => {
				return `${moduleIdentifier}.getActiveElement()?.getId() || null`;
			},
		})),
		t.method("byFieldGroupId", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/Control",
			generator: (ctx, [moduleIdentifier], arg1) => {
				return `${moduleIdentifier}.getControlsByFieldGroupId(${arg1})`;
			},
		})),
		t.method("isStaticAreaRef", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/StaticArea",
			generator: (ctx, [moduleIdentifier], arg1) => {
				return `${moduleIdentifier}.getDomRef() === ${arg1}`;
			},
		})),
		t.method("applyTheme", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/Theming",
			validateArguments: (ctx, _, arg1, arg2) => {
				// Migrate only if second argument is omitted or undefined
				if (!arg2 || (ts.isIdentifier(arg2) && arg2.text === "undefined")) {
					return true;
				}
				return false;
			},
			generator: (ctx, [moduleIdentifier], arg1) => {
				return `${moduleIdentifier}.setTheme(${arg1})`;
			},
		})),
		t.method("getComponent", accessExpressionFix({
			moduleName: "sap/ui/core/Component",
			propertyAccess: "getComponentById",
		})),
	]),
]);
