import ts, {SyntaxKind} from "typescript";
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
		// Migrate only if second argument is omitted or undefined
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
		// Note that alternative replacement Component.get is meanwhile deprecated, too
		t.method("getComponent", accessExpressionFix({
			moduleName: "sap/ui/core/Component",
			propertyAccess: "getComponentById",
		})),
		// Individual arguments must be mapped to "options" object
		// The new API has no sync loading option, replacement is only safe when the options contain async:true
		t.method("loadLibrary", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/Lib",
			propertyAccess: "load",
			validateArguments: (ctx: {json?: Record<string, string>}, checker, arg1, arg2) => {
				ctx.json = {};
				if (arg2?.kind === SyntaxKind.ObjectLiteralExpression) {
					let asyncOption = false;
					const allowlistProps = ["url", "name"];
					ts.forEachChild(arg2, function (node: ts.Node) {
						if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === "async") {
							if (node.initializer.kind === SyntaxKind.TrueKeyword) {
								asyncOption = true; // Migration is possible, async loading is enabled
							}
						}

						if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
							const name = node.name.text;
							if (allowlistProps.includes(name) && ts.isStringLiteralLike(node.initializer)) {
								ctx.json![name] = node.initializer.text;
							}
						}
					});
					if (ts.isStringLiteralLike(arg1)) {
						ctx.json.name = arg1.text;
					}
					return asyncOption;
				} else if (arg2?.kind === SyntaxKind.TrueKeyword) {
					if (ts.isStringLiteralLike(arg1)) {
						ctx.json.name = arg1.text;
					}
					return true; // Migration is possible, async loading is enabled
				} else {
					return false; // Migration is not possible
				}
			},
			generator: (ctx: {json?: Record<string, string>}, moduleIdentifier) => {
				return `${moduleIdentifier}.load(${JSON.stringify(ctx.json)})`;
			},
		})),
		// // Individual arguments must be mapped to "options" object.
		// // The old API defaults to sync component creation. It then cannot be safely replaced with Component.create.
		// // Only when the first argument is an object defining async: true a migration is possible.
		// t.method("createComponent", accessExpressionFix({
		// 	moduleName: "sap/ui/core/Component",
		// 	propertyAccess: "create",
		// 	// validateArguments: (ctx, checker, arg1, arg2) => {},
		// 	// generator: (ctx, moduleIdentifier, arg1) => {
		// 	// 	return `${moduleIdentifier}.create(${arg1})`;
		// 	// },
		// })),
		// Parameter bAsync has to be omitted or set to false since the new API returns
		// the resource bundle synchronously. When bAsync is true, the new API is not a replacement
		// as it does not return a promise. In an await expression, it would be okay, but otherwise not.
		// sLibrary must be a library.
		// t.method("getLibraryResourceBundle", callExpressionGeneratorFix({
		// 	moduleName: "sap/ui/core/Lib",
		// 	validateArguments: (ctx, checker, arg1, arg2) => {
		// 		return true;
		// 	},
		// 	generator: (ctx, moduleIdentifier, arg1) => {
		// 		return `${moduleIdentifier}.getResourceBundleFor(${arg1})`;
		// 	},
		// })),
		// Do not migrate if second argument is provided.
		// We can't generate a ".bind" call since detaching wouldn't be possible anymore
		t.method("attachIntervalTimer", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/IntervalTrigger",
			validateArguments: (ctx, checker, arg1, arg2) => {
				return !arg2 || (ts.isIdentifier(arg2) && arg2.text === "undefined");
			},
			generator: (ctx, moduleIdentifier, arg1) => {
				return `${moduleIdentifier}.addListener(${arg1})`;
			},
		})),
		// Do not migrate if second argument is provided.
		// We can't generate a ".bind" call since detaching wouldn't be possible anymore
		t.method("detachIntervalTimer", callExpressionGeneratorFix({
			moduleName: "sap/ui/core/IntervalTrigger",
			validateArguments: (ctx, checker, arg1, arg2) => {
				return !arg2 || (ts.isIdentifier(arg2) && arg2.text === "undefined");
			},
			generator: (ctx, moduleIdentifier, arg1) => {
				return `${moduleIdentifier}.removeListener(${arg1})`;
			},
		})),

		// Migration to sap/ui/core/tmpl/Template.byId(sId) not possible
		// Template is deprecated, there is no valid replacement in UI5 2.0
		// ["getTemplate", {}],

		// Migration to sap/base/i18n/Localization.attachChange(fnFunction) not possible
		// The Event object has a different API than on the Core facade. There is no more getParameters().
		// Since we can't analyze the callback function with enough certainty, no migration shall be attempted.
		// Also no migration is possible if the second argument is provided. We can't generate a ".bind" call
		// since detaching wouldn't be possible anymore.
		// ["attachLocalizationChanged", {}],

		// Migration to sap/ui/core/Theming.attachApplied(fnFunction) not possible
		// The Event object has a different API than on the Core facade. There is no more getParameters().
		// Since we can't analyze the callback function with enough certainty, no migration shall be attempted.
		// Also no migration is possible the second argument is provided. We can't generate a ".bind" call since
		// detaching wouldn't be possible anymore.
		// ["attachThemeChanged", {}],

		// Migration not possible. See attach method.
		// ["detachLocalizationChanged", {}],

		// Migration not possible
		// ["detachThemeChanged", {}],

		// Migration not possible
		// ["applyChanges", {}],

		// Migration not possible
		// ["attachControlEvent", {}],

		// Migration not possible
		// ["attachFormatError", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["attachParseError", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["attachValidationError", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["attachValidationSuccess", {}],

		// Migration not possible
		// API has been removed, migration likely involves more than removing the usage
		// ["createRenderManager", {}],

		// Migration not possible
		// Unclear which control to use
		// ["createUIArea", {}],

		// Migration not possible
		// ["detachControlEvent", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["detachFormatError", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["detachParseError", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["detachValidationError", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["detachValidationSuccess", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["fireFormatError", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["fireParseError", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["fireValidationError", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["fireValidationSuccess", {}],

		// Migration not possible
		// API has been removed, migration likely involves more than removing the usage
		// ["getApplication", {}],

		// Migration not possible
		// API has been removed, migration likely involves more than removing the usage
		// There is a public replacement for the most common use case that checks the
		// result for a single library (Library.isLoaded(name))
		// ["getLoadedLibraries", {}],

		// Migration not possible
		// Different return types -> Manual migration necessary
		// ["getMessageManager", {}],

		// Migration not possible
		// ["getModel", {}],

		// Migration not possible
		// API has been removed, migration likely involves more than removing the usage
		// ["getRenderManager", {}],

		// Migration not possible
		// ["getRootComponent", {}],

		// Migration not possible
		// We can't determine whether the static UIArea is requested
		// ["getUIArea", {}],

		// Migration not possible
		// API has been removed, migration likely involves more than removing the usage
		// ["getUIDirty", {}],

		// Migration not possible
		// Recommended replacement only available on ManagedObject
		// ["hasModel", {}],

		// Migration not possible
		// API has been removed, migration likely involves more than removing the usage
		// ["includeLibraryTheme", {}],

		// Migration not possible
		// API has been removed, migration likely involves more than removing the usage
		// ["isInitialized", {}],

		// Migration not possible
		// API has been removed, migration likely involves more than removing the usage
		// ["isLocked", {}],

		// Migration not possible
		// Developers should migrate to the theme-applied event
		// ["isThemeApplied", {}],

		// Migration not possible
		// API has been removed, migration likely involves more than removing the usage
		// ["lock", {}],

		// Migration not possible
		// ["registerPlugin", {}],

		// Migration not possible
		// ["sap.ui.core.Core.extend", {}],

		// Migration not possible
		// ["sap.ui.core.Core.getMetadata", {}],

		// Migration not possible
		// ["setModel", {}],

		// Migration not possible
		// ["setRoot", {}],

		// Migration not possible
		// ["setThemeRoot", {}],

		// Migration not possible
		// ["unlock", {}],

		// Migration not possible
		// ["unregisterPlugin", {}],
	]),
]);
