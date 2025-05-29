import ts from "typescript";
import type {ExportCodeToBeUsed, FixHints} from "./FixHints.js";
import {isExpectedValueExpression, extractNamespace} from "../utils/utils.js";
import {AmbientModuleCache} from "../AmbientModuleCache.js";
import type {Ui5TypeInfo} from "../utils/utils.js";

const coreModulesReplacements = new Map<string, FixHints>([
	// https://github.com/SAP/ui5-linter/issues/619
	["attachInit", {
		moduleName: "sap/ui/core/Core", exportNameToBeUsed: "ready",
	}],
	["attachInitEvent", {
		moduleName: "sap/ui/core/Core", exportNameToBeUsed: "ready",
	}],
	["getControl", {
		moduleName: "sap/ui/core/Element", exportNameToBeUsed: "getElementById",
	}],
	["getElementById", {
		moduleName: "sap/ui/core/Element", exportNameToBeUsed: "getElementById",
	}],
	["byId", {
		moduleName: "sap/ui/core/Element", exportNameToBeUsed: "getElementById",
	}],
	["getEventBus", {
		moduleName: "sap/ui/core/EventBus", exportNameToBeUsed: "getInstance",
	}],
	["getStaticAreaRef", {
		moduleName: "sap/ui/core/StaticArea", exportNameToBeUsed: "getDomRef",
	}],
	["initLibrary", {
		moduleName: "sap/ui/core/Lib", exportNameToBeUsed: "init",
	}],
	["isMobile", {
		moduleName: "sap/ui/Device", exportCodeToBeUsed: "$moduleIdentifier.browser.mobile",
	}],
	["notifyContentDensityChanged", {
		moduleName: "sap/ui/core/Theming", exportNameToBeUsed: "notifyContentDensityChanged",
	}],
	["byFieldGroupId", {
		moduleName: "sap/ui/core/Control", exportCodeToBeUsed: "$moduleIdentifier.getControlsByFieldGroupId($1)",
	}],
	["isStaticAreaRef", {
		moduleName: "sap/ui/core/StaticArea",
		exportCodeToBeUsed: "$moduleIdentifier.getDomRef() === $1",
	}],
	// TODO: The legacy API return null if the control is not found.
	// ["getCurrentFocusedControlId", {
	// 	moduleName: "sap/ui/core/Element", exportNameToBeUsed: "getActiveElement()?.getId",
	// }],
	// // Migrate only if second argument is omitted or undefined
	// ["applyTheme", {
	// 	moduleName: "sap/ui/core/Theming",
	// 	exportCodeToBeUsed: "$moduleIdentifier.setTheme($1)",
	// }],
	// // Individual arguments must be mapped to "options" object
	// // The new API has no sync loading option, replacement is only safe when the options contain async:true
	// ["loadLibrary", {
	// 	moduleName: "sap/ui/core/Lib", exportCodeToBeUsed: "$moduleIdentifier.load($1)",
	// }],
	// // Individual arguments must be mapped to "options" object.
	// // The old API defaults to sync component creation. It then cannot be safely replaced with Component.create.
	// // Only when the first argument is an object defining async: true a migration is possible.
	// ["createComponent", {
	// 	moduleName: "sap/ui/core/Component", exportCodeToBeUsed: "$moduleIdentifier.create($1)",
	// }],
	// // Note that alternative replacement Component.get is meanwhile deprecated, too
	// ["getComponent", {
	// 	moduleName: "sap/ui/core/Component", exportNameToBeUsed: "getComponentById",
	// }],
	// // Parameter bAsync has to be omitted or set to false since the new API returns
	// // the resource bundle synchronously. When bAsync is true, the new API is not a replacement
	// // as it does not return a promise. In an await expression, it would be okay, but otherwise not.
	// // TODO: To be discussed: sLibrary must be a library, that might not be easy to check
	// ["getLibraryResourceBundle", {
	// 	moduleName: "sap/ui/core/Lib", exportCodeToBeUsed: "$moduleIdentifier.getResourceBundleFor($1, $2)",
	// }],

	// TODO: Can't be safely migrated for now. The callback function might have code
	// that has to be migrated, too. MagicString will throw an exception.
	// The same as jQuery.sap.delayedCall case
	//
	// // Do not migrate if second argument is provided.
	// // We can't generate a ".bind" call since detaching wouldn't be possible anymore
	// ["attachIntervalTimer", {
	// 	moduleName: "sap/ui/core/IntervalTrigger",
	// 	exportCodeToBeUsed: "$moduleIdentifier.addListener($1)",
	// }],
	// // Do not migrate if second argument is provided.
	// // We can't generate a ".bind" call since detaching wouldn't be possible anymore
	// ["detachIntervalTimer", {
	// 	moduleName: "sap/ui/core/IntervalTrigger",
	// 	exportCodeToBeUsed: "$moduleIdentifier.removeListener($1, $2)",
	// }],

	// No direct replacement available
	// ... but further calls on the result should be fixable. Can we detect and remove remaining calls (dead code)?
	// ["getConfiguration", {
	// 	// https://github.com/SAP/ui5-linter/issues/620
	// }],

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
]);

export default class CoreFixHintsGenerator {
	constructor(
		private ambientModuleCache: AmbientModuleCache
	) {

	}

	getFixHints(node: ts.CallExpression | ts.AccessExpression, ui5TypeInfo: Ui5TypeInfo): FixHints | undefined {
		if (!ts.isPropertyAccessExpression(node)) {
			return undefined;
		}

		if ("module" in ui5TypeInfo && ui5TypeInfo.module !== "sap/ui/core/Core" &&
			"namespace" in ui5TypeInfo && ui5TypeInfo.namespace !== "sap.ui.getCore") {
			return undefined;
		}

		const namespace = extractNamespace(node);
		const methodName = namespace?.split(".").pop() ?? "";
		const moduleReplacement = coreModulesReplacements.get(methodName);
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
