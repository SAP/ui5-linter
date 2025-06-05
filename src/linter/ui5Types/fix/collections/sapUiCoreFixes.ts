import ts from "typescript";
import Ui5TypeInfoMatcher from "../../Ui5TypeInfoMatcher.js";
import {AccessExpressionFixScope} from "../AccessExpressionFix.js";
import {
	FixTypeInfoFilter,
	accessExpressionFix,
	callExpressionGeneratorFix,
} from "../FixFactory.js";

const f: FixTypeInfoFilter = new Ui5TypeInfoMatcher("sap.ui.core");
export default f;
f.declareModule("sap/ui/core/Core", [
	f.class("Core", [
		...f.methods(["attachInit", "attachInitEvent"], accessExpressionFix({
			scope: AccessExpressionFixScope.FirstAccessExpression,
			moduleName: "sap/ui/core/Core",
			propertyAccess: "ready",
		})),
		...f.methods(["getControl", "getElementById", "byId"], accessExpressionFix({
			scope: AccessExpressionFixScope.FirstAccessExpression,
			moduleName: "sap/ui/core/Element",
			propertyAccess: "getElementById",
		})),
		f.method("getEventBus", accessExpressionFix({
			scope: AccessExpressionFixScope.FirstAccessExpression,
			moduleName: "sap/ui/core/EventBus",
			propertyAccess: "getInstance",
		})),
		f.method("getStaticAreaRef", accessExpressionFix({
			scope: AccessExpressionFixScope.FirstAccessExpression,
			moduleName: "sap/ui/core/StaticArea",
			propertyAccess: "getDomRef",
		})),
		f.method("initLibrary", accessExpressionFix({
			scope: AccessExpressionFixScope.FirstAccessExpression,
			moduleName: "sap/ui/core/Lib",
			propertyAccess: "init",
		})),
		f.method("isMobile", callExpressionGeneratorFix({
			moduleName: "sap/ui/Device",
			generator: (ctx, moduleIdentifier) => {
				return `${moduleIdentifier}.browser.mobile`;
			},
		})),
		f.method("notifyContentDensityChanged", accessExpressionFix({
			scope: AccessExpressionFixScope.SecondAccessExpression,
			moduleName: "sap/ui/core/Theming",
		})),
		f.method("getCurrentFocusedControlId", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/Element",
			// The legacy API used to return null if no control was focused.
			generator: (ctx, moduleIdentifier) => {
				return `${moduleIdentifier}.getActiveElement()?.getId() || null`;
			},
		})),
		f.method("byFieldGroupId", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/Control",
			generator: (ctx, moduleIdentifier, arg1) => {
				return `${moduleIdentifier}.getControlsByFieldGroupId(${arg1})`;
			},
		})),
		f.method("isStaticAreaRef", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/StaticArea",
			generator: (ctx, moduleIdentifier, arg1) => {
				return `${moduleIdentifier}.getDomRef() === ${arg1}`;
			},
		})),
		f.method("applyTheme", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/Theming",
			validateArguments: (ctx, arg1, arg2) => {
				// Migrate only if second argument is omitted or undefined
				if (!arg2 || (ts.isIdentifier(arg2) && arg2.text === "undefined")) {
					return true;
				}
				return false;
			},
			generator: (ctx, moduleIdentifier, arg1, arg2) => {
				// TODO: Validating in the generator is bad practice
				if (!arg2 || arg2 === "undefined") {
					return `${moduleIdentifier}.setTheme(${arg1})`;
				}
			},
		})),
		f.method("getComponent", accessExpressionFix({
			moduleName: "sap/ui/core/Component",
			propertyAccess: "getComponentById",
		})),
	]),
]);
