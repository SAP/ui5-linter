import ts from "typescript";
import Ui5TypeInfoMatcher from "../../Ui5TypeInfoMatcher.js";
import {FixTypeInfoFilter, accessExpressionFix, callExpressionFix, callExpressionGeneratorFix} from "../FixFactory.js";
import CallExpressionFix, {CallExpressionFixScope} from "../CallExpressionFix.js";
import {ChangeAction} from "../../../../autofix/autofix.js";
import {AccessExpressionFixScope} from "../AccessExpressionFix.js";
import {PositionInfo} from "../../../LinterContext.js";

/**
 * NOTE: Since jQuery.sap APIs are not fully typed, we generate a "mocked" UI5 Type Info in module "getJqueryFixInfo.ts"
 * To keep it simple, that module simply treats everything as a NAMESPACE.
 *
 * Therefore, the filters expressed here MUST ALWAYS USE NAMESPACE, regardless of the actual type.
*/

const f: FixTypeInfoFilter = new Ui5TypeInfoMatcher("jquery");
export default f;

f.declareModule("jQuery", [
	f.namespace("sap", [
		f.namespace("assert", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/520
			moduleName: "sap/base/assert",
		})),
		f.namespace("log", [ // https://github.com/SAP/ui5-linter/issues/522
			...f.namespaces(["Level", "LogLevel"], accessExpressionFix({
				moduleName: "sap/base/Log",
				propertyAccess: "Level",
			})),
			...f.namespaces(["debug", "error", "fatal", "info", "trace", "warning"],
				callExpressionFix({
					moduleName: "sap/base/Log",
					scope: CallExpressionFixScope.SecondAccessExpression,
					// Log.debug/warn/info/etc return "void", but the legacy
					// jQuery.log.debug was returning "this". Therefore a replacement
					// is only safe if the return value is not used in the code
					mustNotUseReturnValue: true,
				})),
			f.namespace("getLevel", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: AccessExpressionFixScope.SecondAccessExpression,
			})),
			f.namespace("getLog", accessExpressionFix({
				moduleName: "sap/base/Log",
				propertyAccess: "getLogEntries",
			})),
			f.namespace("getLogEntries", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: AccessExpressionFixScope.SecondAccessExpression,
			})),
			f.namespace("addLogListener", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: AccessExpressionFixScope.SecondAccessExpression,
			})),
			f.namespace("removeLogListener", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: AccessExpressionFixScope.SecondAccessExpression,
			})),
			f.namespace("getLogger", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: AccessExpressionFixScope.SecondAccessExpression,
			})),
			f.namespace("logSupportInfo", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: AccessExpressionFixScope.SecondAccessExpression,
			})),
			f.namespace("isLoggable", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: AccessExpressionFixScope.SecondAccessExpression,
			})),
		]),
		f.namespace("resources", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/521
			moduleName: "sap/base/i18n/ResourceBundle",
			propertyAccess: "create",
		})),
		f.namespace("encodeCSS", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/524
			moduleName: "sap/base/security/encodeCSS",
		})),
		f.namespace("encodeJS", accessExpressionFix({
			moduleName: "sap/base/security/encodeJS",
		})),
		f.namespace("encodeURL", accessExpressionFix({
			moduleName: "sap/base/security/encodeURL",
		})),
		f.namespace("encodeURLParameters", accessExpressionFix({
			moduleName: "sap/base/security/encodeURLParameters",
		})),
		f.namespace("encodeHTML", accessExpressionFix({
			moduleName: "sap/base/security/encodeXML",
		})),
		f.namespace("encodeXML", accessExpressionFix({
			moduleName: "sap/base/security/encodeXML",
		})),
		f.namespace("addUrlWhitelist", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/525
			moduleName: "sap/base/security/URLListValidator",
			propertyAccess: "add",
		})),
		f.namespace("clearUrlWhitelist", accessExpressionFix({
			moduleName: "sap/base/security/URLListValidator",
			propertyAccess: "clear",
		})),
		f.namespace("getUrlWhitelist", accessExpressionFix({
			moduleName: "sap/base/security/URLListValidator",
			propertyAccess: "entries",
		})),
		f.namespace("validateUrl", accessExpressionFix({
			moduleName: "sap/base/security/URLListValidator",
			propertyAccess: "validate",
		})),
		f.namespace("camelCase", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/527
			moduleName: "sap/base/strings/camelize",
		})),
		f.namespace("charToUpperCase", () => {
			return new CharToUpperCaseFix();
		}),
		f.namespace("escapeRegExp", accessExpressionFix({
			moduleName: "sap/base/strings/escapeRegExp",
		})),
		f.namespace("formatMessage", accessExpressionFix({
			moduleName: "sap/base/strings/formatMessage",
		})),
		f.namespace("formatMessage", accessExpressionFix({
			moduleName: "sap/base/strings/formatMessage",
		})),
		f.namespace("hashCode", accessExpressionFix({
			moduleName: "sap/base/strings/hashCode",
			preferredIdentifier: "hash",
		})),
		f.namespace("hyphen", accessExpressionFix({
			moduleName: "sap/base/strings/hyphenate",
		})),
		f.namespace("isStringNFC", () => new IsStringNfcFix()),
		f.namespace("arraySymbolDiff", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/528
			moduleName: "sap/base/util/array/diff",
		})),
		f.namespace("unique", accessExpressionFix({
			moduleName: "sap/base/util/array/uniqueSort",
		})),
		f.namespace("equal", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/529
			moduleName: "sap/base/util/deepEqual",
		})),
		f.namespace("each", accessExpressionFix({
			moduleName: "sap/base/util/each",
		})),
		f.namespace("forIn", accessExpressionFix({
			moduleName: "sap/base/util/each",
		})),
		f.namespace("FrameOptions", accessExpressionFix({
			moduleName: "sap/ui/security/FrameOptions",
		})),
		f.namespace("parseJS", accessExpressionFix({
			scope: AccessExpressionFixScope.SecondAccessExpression,
			moduleName: "sap/base/util/JSTokenizer",
		})),

		/* "extend" migration requires special handling:
			jQuery.sap.extends has an optional first argument "deep" which controls whether
			a shallow or deep copy is performed.

			In case of a shallow clone (default), Object.assign might be a suitable replacement?

			Only in case of a deep clone (first argument is true; explicitly type "boolean"),
			the merge module shall be used (omitting the first argument)

			Note: migrate only if the first argument is explicitly deep clone (true)
		*/
		// f.namespace("extend", accessExpressionFix({
		// 	moduleName: "sap/base/util/merge",
		// 	exportCodeToBeUsed: "$moduleIdentifier($2, $3)",
		// })),
		f.namespace("now", accessExpressionFix({
			moduleName: "sap/base/util/now",
		})),
		f.namespace("properties", accessExpressionFix({
			moduleName: "sap/base/util/Properties",
			propertyAccess: "create",
		})),
		f.namespace("uid", accessExpressionFix({
			moduleName: "sap/base/util/uid",
		})),
		f.namespace("Version", accessExpressionFix({
			moduleName: "sap/base/util/Version",
		})),
		f.namespace("syncStyleClass", accessExpressionFix({
			moduleName: "sap/ui/core/syncStyleClass",
		})),
		// f.namespace("setObject", accessExpressionFix({
		// 	// TODO: Needs to use "exportCodeToBeUsed" prop as the first argument MUST be patched to be a string
		// 	// moduleName: "sap/base/util/ObjectPath",
		// })),
		f.namespace("containsOrEquals", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/542
			moduleName: "sap/ui/dom/containsOrEquals",
		})),
		f.namespace("denormalizeScrollBeginRTL", accessExpressionFix({
			moduleName: "sap/ui/dom/denormalizeScrollBeginRTL",
		})),
		f.namespace("denormalizeScrollLeftRTL", accessExpressionFix({
			moduleName: "sap/ui/dom/denormalizeScrollLeftRTL",
		})),
		f.namespace("ownerWindow", accessExpressionFix({
			moduleName: "sap/ui/dom/getOwnerWindow",
		})),
		f.namespace("scrollbarSize", accessExpressionFix({
			moduleName: "sap/ui/dom/getScrollbarSize",
		})),
		f.namespace("includeScript", accessExpressionFix({
			moduleName: "sap/ui/dom/includeScript",
		})),
		f.namespace("includeStyleSheet", accessExpressionFix({
			moduleName: "sap/ui/dom/includeStylesheet",
		})),
		f.namespace("pxToRem", accessExpressionFix({
			moduleName: "sap/ui/dom/units/Rem",
			propertyAccess: "fromPx",
		})),
		f.namespace("remToPx", accessExpressionFix({
			moduleName: "sap/ui/dom/units/Rem",
			propertyAccess: "toPx",
		})),
		f.namespace("checkMouseEnterOrLeave", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/543
			moduleName: "sap/ui/events/checkMouseEnterOrLeave",
		})),
		f.namespace("bindAnyEvent", accessExpressionFix({
			scope: AccessExpressionFixScope.SecondAccessExpression,
			moduleName: "sap/ui/events/ControlEvents",
		})),
		f.namespace("unbindAnyEvent", accessExpressionFix({
			scope: AccessExpressionFixScope.SecondAccessExpression,
			moduleName: "sap/ui/events/ControlEvents",
		})),
		f.namespace("ControlEvents", accessExpressionFix({
			moduleName: "sap/ui/events/ControlEvents",
			propertyAccess: "events",
		})),
		f.namespace("handleF6GroupNavigation", accessExpressionFix({
			scope: AccessExpressionFixScope.SecondAccessExpression,
			moduleName: "sap/ui/events/F6Navigation",
		})),
		f.namespace("touchEventMode", accessExpressionFix({
			scope: AccessExpressionFixScope.SecondAccessExpression,
			moduleName: "sap/ui/events/jquery/EventSimulation",
		})),
		f.namespace("keycodes", accessExpressionFix({
			moduleName: "sap/ui/events/KeyCodes",
		})),
		f.namespace("PseudoEvents", accessExpressionFix({
			moduleName: "sap/ui/events/PseudoEvents",
			propertyAccess: "events",
		})),
		f.namespace("disableTouchToMouseHandling", accessExpressionFix({
			scope: AccessExpressionFixScope.SecondAccessExpression,
			moduleName: "sap/ui/events/TouchToMouseMapping",
		})),
		f.namespace("measure", [ // https://github.com/SAP/ui5-linter/issues/555
			f.namespace("getRequestTimings", callExpressionGeneratorFix({
				globalName: "performance",
				generator(ctx, moduleIdentifierName) {
					return `${moduleIdentifierName}.getEntriesByType("resource")`;
				},
			})),
			f.namespace("clearRequestTimings", accessExpressionFix({
				globalName: "performance",
				propertyAccess: "clearResourceTimings",
			})),
			f.namespace("setRequestBufferSize", accessExpressionFix({
				globalName: "performance",
				propertyAccess: "setResourceTimingBufferSize",
			})),
			f.namespace("start", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("add", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("end", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("average", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("clear", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("filterMeasurements", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("getAllMeasurements", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("getMeasurement", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("pause", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("resume", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("getActive", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("setActive", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("remove", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("registerMethod", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("unregisterMethod", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("unregisterAllMethods", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/Measurement",
			})),
			f.namespace("clearInteractionMeasurements", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "clear",
			})),
			f.namespace("startInteraction", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "start",
			})),
			f.namespace("endInteraction", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "end",
			})),
			f.namespace("filterInteractionMeasurements", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "filter",
			})),
			f.namespace("getAllInteractionMeasurements", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "getAll",
			})),
			f.namespace("getPendingInteractionMeasurement", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "getPending",
			})),
		]), // measure
		f.namespace("fesr", [ // https://github.com/SAP/ui5-linter/issues/561
			f.namespace("setActive", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/FESR",
			})),
			f.namespace("getActive", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/FESR",
			})),
			f.namespace("addBusyDuration", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			f.namespace("getCurrentTransactionId", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Passport",
			})),
			f.namespace("getRootId", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Passport",
			})),
		]),
		f.namespace("interaction", [
			f.namespace("getActive", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			f.namespace("setActive", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			f.namespace("notifyStepStart", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			f.namespace("notifyStepEnd", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			f.namespace("notifyEventStart", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			f.namespace("notifyScrollEvent", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			f.namespace("notifyEventEnd", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			f.namespace("setStepComponent", accessExpressionFix({
				scope: AccessExpressionFixScope.SecondAccessExpression,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
		]), // interaction
		f.namespace("passport", [
			f.namespace("setActive", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Passport",
				propertyAccess: "setActive",
			})),
			f.namespace("traceFlags", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Passport",
				propertyAccess: "traceFlags",
			})),
		]),
		f.namespace("initMobile", accessExpressionFix({
			moduleName: "sap/ui/util/Mobile",
			propertyAccess: "init",
		})),
		f.namespace("setIcons", accessExpressionFix({
			moduleName: "sap/ui/util/Mobile",
			propertyAccess: "setIcons",
		})),
		f.namespace("setMobileWebAppCapable", accessExpressionFix({
			moduleName: "sap/ui/util/Mobile",
			propertyAccess: "setWebAppCapable",
		})),
		f.namespace("storage", [
			f.namespace("Storage", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
			})),
			f.namespace("Type", [
				f.namespace("local", accessExpressionFix({
					moduleName: "sap/ui/util/Storage",
					propertyAccess: "Type.local",
				})),
				f.namespace("session", accessExpressionFix({
					moduleName: "sap/ui/util/Storage",
					propertyAccess: "Type.session",
				})),
			]),
			f.namespace("isSupported", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "isSupported",
			})),
			f.namespace("clear", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "clear",
			})),
			f.namespace("get", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "get",
			})),
			f.namespace("getType", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "getType",
			})),
			f.namespace("put", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "put",
			})),
			f.namespace("remove", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "remove",
			})),
			f.namespace("removeAll", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "removeAll",
			})),
		], callExpressionFix({
			moduleName: "sap/ui/util/Storage",
			newExpression: true,
		})),
		f.namespace("getParseError", accessExpressionFix({
			scope: AccessExpressionFixScope.SecondAccessExpression,
			moduleName: "sap/ui/util/XMLHelper",
		})),
		f.namespace("parseXML", accessExpressionFix({
			moduleName: "sap/ui/util/XMLHelper",
			propertyAccess: "parse",
		})),
		f.namespace("serializeXML", accessExpressionFix({
			moduleName: "sap/ui/util/XMLHelper",
			propertyAccess: "serialize",
		})),
		f.namespace("startsWith", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "$1.startsWith($2)",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			generator: (ctx, _, arg1, arg2) => {
				return `${arg1}.startsWith(${arg2})`;
			},
		})),
		f.namespace("startsWithIgnoreCase", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "$1.toUpperCase().startsWith($2.toUpperCase())",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			generator: (ctx, _, arg1, arg2) => {
				return `${arg1}.toUpperCase().startsWith(${arg2}.toUpperCase())`;
			},
		})),
		f.namespace("endsWith", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "$1.endsWith($2)",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			generator: (ctx, _, arg1, arg2) => {
				return `${arg1}.endsWith(${arg2})`;
			},
		})),
		f.namespace("endsWithIgnoreCase", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "$1.toUpperCase().endsWith($2.toUpperCase())",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			generator: (ctx, _, arg1, arg2) => {
				return `${arg1}.toUpperCase().endsWith(${arg2}.toUpperCase())`;
			},
		})),
		f.namespace("padLeft", callExpressionGeneratorFix<{defaultString: boolean}>({
			// exportCodeToBeUsed: "$1.padStart($3, $2)",
			validateArguments: (ctx, checker, arg1, arg2) => {
				if (arg1 && !ts.isStringLiteralLike(arg1)) {
					ctx.defaultString = true;
				}
				if (!arg2 || !ts.isStringLiteralLike(arg2) ||
					// String literals are enclosed in double quotes, so the length of an empty string is 2
					arg2.text.length > 3) {
					// API not compatible if the second argument is not a string or string with lenght <> 1
					return false;
				}
				return true;
			},
			generator: (ctx, _, arg1, arg2, arg3) => {
				if (ctx.defaultString) {
					arg1 = `(${arg1} || "")`;
				}
				return `${arg1}.padStart(${arg3}, ${arg2})`;
			},
		})),
		f.namespace("padRight", callExpressionGeneratorFix<{defaultString: boolean}>({
			// exportCodeToBeUsed: "$1.padEnd($3, $2)",
			validateArguments: (ctx, checker, arg1, arg2) => {
				if (arg1 && !ts.isStringLiteralLike(arg1)) {
					ctx.defaultString = true;
				}
				if (!arg2 || !ts.isStringLiteralLike(arg2) ||
					// String literals are enclosed in double quotes, so the length of an empty string is 2
					arg2.text.length > 3) {
					// API not compatible if the second argument is not a string or string with lenght <> 1
					return false;
				}
				return true;
			},
			generator: (ctx, _, arg1, arg2, arg3) => {
				if (ctx.defaultString) {
					arg1 = `(${arg1} || "")`;
				}
				return `${arg1}.padEnd(${arg3}, ${arg2})`;
			},
		})),
		f.namespace("domById", callExpressionGeneratorFix({
			globalName: "document",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			// exportCodeToBeUsed: "window.document.getElementById($1)",
			generator: (ctx, moduleIdentifier, arg1) => {
				return `${moduleIdentifier}.getElementById(${arg1})`;
			},
		})),
		f.namespace("isEqualNode", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "!!$1?.isEqualNode($2)",
			generator: (ctx, _, arg1, arg2) => {
				return `!!${arg1}?.isEqualNode(${arg2})`;
			},
		})),
		f.namespace("newObject", callExpressionGeneratorFix({
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			// exportCodeToBeUsed: "Object.create($1)",
			generator: (ctx, _, arg1) => {
				return `Object.create(${arg1})`;
			},
		})),
		f.namespace("getter", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "((value) => () => value)($1)",
			generator: (ctx, _, arg1) => {
				return `((value) => () => value)(${arg1})`;
			},
		})),
		f.namespace("getModulePath", callExpressionGeneratorFix({ // https://github.com/SAP/ui5-linter/issues/589
			globalName: "sap.ui.require",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			// exportCodeToBeUsed: "sap.ui.require.toUrl($1)",
			generator: (ctx, moduleIdentifier, arg1) => {
				return `${moduleIdentifier}.toUrl(${arg1})`;
			},
		})),
		f.namespace("getResourcePath", callExpressionGeneratorFix({
			globalName: "sap.ui.require",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			// exportCodeToBeUsed: "sap.ui.require.toUrl($1)",
			generator: (ctx, moduleIdentifier, arg1) => {
				return `${moduleIdentifier}.toUrl(${arg1})`;
			},
		})),
	]),

	// jQuery.*
	// TODO
]);

/**
 * Fix for jQuery.sap.isStringNFC
 * 	Source: jQuery.sap.isStringNFC("foo")
 * 	Target: "foo".normalize("NFC") === "foo"
 */
class IsStringNfcFix extends CallExpressionFix {
	private arg?: string;

	constructor() {
		super({
			scope: CallExpressionFixScope.CallExpression,
		});
	}

	// visitLinterNode(node: ts.Node, sourcePosition: PositionInfo, checker: ts.TypeChecker) {
	// 	// TODO: Check whether argument is identifier or string literal
	// 	// In case of identifier, we need to check whether it's type is a string literal
	// }

	visitAutofixNode(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!super.visitAutofixNode(node, position, sourceFile)) {
			return false;
		}
		if (!ts.isCallExpression(node) || !node.arguments.length) {
			return false;
		}

		if (!ts.isStringLiteralLike(node.arguments[0])) {
			return false;
		}

		this.arg = node.arguments[0].text;
		return true;
	}

	generateChanges() {
		if (this.startPos === undefined || this.endPos === undefined || this.arg === undefined) {
			throw new Error("Start or end position or argument is not defined");
		}

		const value = `"${this.arg}".normalize("NFC") === "${this.arg}"`;
		return {
			action: ChangeAction.REPLACE,
			start: this.startPos,
			end: this.endPos,
			value,
		};
	}
}

/**
 * Fix for jQuery.sap.charToUpperCase
 * 	Source: jQuery.sap.charToUpperCase("foo")
 * 	Target: capitalize("foo")
 *
 * NOTE - This fix requires special validation:
 *
 * Since the capitalize module does not accept a position argument, this migration must
 * only be applied if it is **the first character that is supposed to be capitalized**.
 * In the legacy charToUpperCase API, this is controlled by the second argument ("position").
 * If it is omitted, set to zero, a negative number, or beyond the last character,
 * the first character is to be capitalized.
 * In all other cases, this migration must not be applied.
 * If the first argument is not a string, the migration must not be applied either.
 */
class CharToUpperCaseFix extends CallExpressionFix {
	private argIdentifierName?: string;
	private argStringValue?: string;

	constructor() {
		super({
			moduleName: "sap/base/strings/capitalize",
			scope: CallExpressionFixScope.CallExpression,
		});
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo, checker: ts.TypeChecker) {
		if (!super.visitLinterNode(node, sourcePosition, checker)) {
			return false;
		}
		if (!ts.isCallExpression(node) || node.arguments.length < 1) {
			// Must have at least one argument (the string to be capitalized)
			return false;
		}
		const stringArg = node.arguments[0];
		if (!ts.isStringLiteralLike(stringArg) && !ts.isIdentifier(stringArg)) {
			// First argument must be a string literal or identifier
			return false;
		}
		let stringLength;
		if (ts.isIdentifier(stringArg)) {
			// If it's an identifier, we need to check whether it is a string literal type
			const argType = checker.getTypeAtLocation(stringArg);
			if (!argType.isStringLiteral()) {
				return false;
			}
			stringLength = argType.value.length;
			this.argIdentifierName = stringArg.text;
		} else {
			stringLength = stringArg.text.length;
			this.argStringValue = stringArg.getText();
		}

		if (node.arguments.length === 2) {
			const positionArg = node.arguments[1];
			if (!ts.isNumericLiteral(positionArg) &&
				(!ts.isPrefixUnaryExpression(positionArg) || !ts.isNumericLiteral(positionArg.operand))) {
				// Second argument must be a numeric literal if provided
				return false;
			}
			if (ts.isPrefixUnaryExpression(positionArg)) {
				// If it's a prefix unary expression, we need to check whether it is a negative number
				if (positionArg.operator !== ts.SyntaxKind.MinusToken) {
					return false;
				}
			} else {
				const positionValue = parseInt(positionArg.text, 10);
				if (positionValue > 0 && positionValue < stringLength) {
					// If the position is greater than 0 and less than the string length, we cannot apply the fix
					return false;
				}
			}
		}
		// Fix can be applied
		return true;
	}

	visitAutofixNode(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!super.visitAutofixNode(node, position, sourceFile)) {
			return false;
		}
		if (this.argStringValue) {
			// Nothing more to do
			return true;
		}

		// If the argument is an identifier, we should check whether its name is still the same in
		// the autofix AST
		if (!ts.isCallExpression(node)) {
			return false;
		}

		const firstArg = node.arguments[0];
		if (!ts.isIdentifier(firstArg)) {
			return false;
		}
		// Update the identifier name just in case
		this.argIdentifierName = firstArg.text;
		return true;
	}

	generateChanges() {
		if (this.startPos === undefined || this.endPos === undefined) {
			throw new Error("Start or end position or argument is not defined");
		}

		if (this.argIdentifierName === undefined && this.argStringValue === undefined) {
			// Identifier has not been set. This can happen if the relevant position is not inside a
			// module definition or require block. Therefore the fix can not be applied.
			return;
		}
		const arg = this.argStringValue ?? this.argIdentifierName;
		const value = `${this.moduleIdentifierName}(${arg})`;
		return {
			action: ChangeAction.REPLACE,
			start: this.startPos,
			end: this.endPos,
			value,
		};
	}
}
