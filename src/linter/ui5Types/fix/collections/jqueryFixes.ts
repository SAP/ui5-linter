import ts from "typescript";
import Ui5TypeInfoMatcher from "../../Ui5TypeInfoMatcher.js";
import {FixTypeInfoMatcher, accessExpressionFix, callExpressionFix, callExpressionGeneratorFix} from "../FixFactory.js";
import CallExpressionFix from "../CallExpressionFix.js";
import {ChangeAction} from "../../../../autofix/autofix.js";
import {PositionInfo} from "../../../LinterContext.js";
import {FixScope} from "../BaseFix.js";

/**
 * NOTE: Since jQuery.sap APIs are not fully typed, we generate a "mocked" UI5 Type Info in module "getJqueryFixInfo.ts"
 * To keep it simple, that module simply treats everything as a NAMESPACE.
 *
 * Therefore, the filters expressed here MUST ALWAYS USE NAMESPACE, regardless of the actual type.
*/

const t: FixTypeInfoMatcher = new Ui5TypeInfoMatcher("jquery");
export default t;

t.declareModule("jQuery", [
	t.namespace("sap", [
		t.namespace("assert", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/520
			moduleName: "sap/base/assert",
		})),
		t.namespace("log", [ // https://github.com/SAP/ui5-linter/issues/522
			...t.namespaces(["Level", "LogLevel"], accessExpressionFix({
				moduleName: "sap/base/Log",
				propertyAccess: "Level",
			})),
			...t.namespaces(["debug", "error", "fatal", "info", "trace", "warning"],
				callExpressionFix({
					moduleName: "sap/base/Log",
					scope: FixScope.SecondChild,
					// Log.debug/warn/info/etc return "void", but the legacy
					// jQuery.log.debug was returning "this". Therefore a replacement
					// is only safe if the return value is not used in the code
					mustNotUseReturnValue: true,
				})),
			t.namespace("getLevel", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: FixScope.FirstChild,
			})),
			t.namespace("getLog", accessExpressionFix({
				moduleName: "sap/base/Log",
				propertyAccess: "getLogEntries",
			})),
			t.namespace("getLogEntries", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: FixScope.FirstChild,
			})),
			t.namespace("addLogListener", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: FixScope.FirstChild,
			})),
			t.namespace("removeLogListener", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: FixScope.FirstChild,
			})),
			t.namespace("getLogger", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: FixScope.FirstChild,
			})),
			t.namespace("logSupportInfo", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: FixScope.FirstChild,
			})),
			t.namespace("isLoggable", accessExpressionFix({
				moduleName: "sap/base/Log",
				scope: FixScope.FirstChild,
			})),
		]),
		t.namespace("resources", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/521
			moduleName: "sap/base/i18n/ResourceBundle",
			propertyAccess: "create",
		})),
		t.namespace("encodeCSS", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/524
			moduleName: "sap/base/security/encodeCSS",
		})),
		t.namespace("encodeJS", accessExpressionFix({
			moduleName: "sap/base/security/encodeJS",
		})),
		t.namespace("encodeURL", accessExpressionFix({
			moduleName: "sap/base/security/encodeURL",
		})),
		t.namespace("encodeURLParameters", accessExpressionFix({
			moduleName: "sap/base/security/encodeURLParameters",
		})),
		t.namespace("encodeHTML", accessExpressionFix({
			moduleName: "sap/base/security/encodeXML",
		})),
		t.namespace("encodeXML", accessExpressionFix({
			moduleName: "sap/base/security/encodeXML",
		})),
		t.namespace("addUrlWhitelist", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/525
			moduleName: "sap/base/security/URLListValidator",
			propertyAccess: "add",
		})),
		t.namespace("clearUrlWhitelist", accessExpressionFix({
			moduleName: "sap/base/security/URLListValidator",
			propertyAccess: "clear",
		})),
		t.namespace("getUrlWhitelist", accessExpressionFix({
			moduleName: "sap/base/security/URLListValidator",
			propertyAccess: "entries",
		})),
		t.namespace("validateUrl", accessExpressionFix({
			moduleName: "sap/base/security/URLListValidator",
			propertyAccess: "validate",
		})),
		t.namespace("camelCase", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/527
			moduleName: "sap/base/strings/camelize",
		})),
		t.namespace("charToUpperCase", () => {
			return new CharToUpperCaseFix();
		}),
		t.namespace("escapeRegExp", accessExpressionFix({
			moduleName: "sap/base/strings/escapeRegExp",
		})),
		t.namespace("formatMessage", accessExpressionFix({
			moduleName: "sap/base/strings/formatMessage",
		})),
		t.namespace("formatMessage", accessExpressionFix({
			moduleName: "sap/base/strings/formatMessage",
		})),
		t.namespace("hashCode", accessExpressionFix({
			moduleName: "sap/base/strings/hashCode",
			preferredIdentifier: "hash",
		})),
		t.namespace("hyphen", accessExpressionFix({
			moduleName: "sap/base/strings/hyphenate",
		})),
		t.namespace("isStringNFC", () => new IsStringNfcFix()),
		t.namespace("arraySymbolDiff", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/528
			moduleName: "sap/base/util/array/diff",
		})),
		t.namespace("unique", accessExpressionFix({
			moduleName: "sap/base/util/array/uniqueSort",
		})),
		t.namespace("equal", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/529
			moduleName: "sap/base/util/deepEqual",
		})),
		t.namespace("each", accessExpressionFix({
			moduleName: "sap/base/util/each",
		})),
		t.namespace("forIn", accessExpressionFix({
			moduleName: "sap/base/util/each",
		})),
		t.namespace("FrameOptions", accessExpressionFix({
			moduleName: "sap/ui/security/FrameOptions",
		})),
		t.namespace("parseJS", accessExpressionFix({
			scope: FixScope.FirstChild,
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
		t.namespace("now", accessExpressionFix({
			moduleName: "sap/base/util/now",
		})),
		t.namespace("properties", accessExpressionFix({
			moduleName: "sap/base/util/Properties",
			propertyAccess: "create",
		})),
		t.namespace("uid", accessExpressionFix({
			moduleName: "sap/base/util/uid",
		})),
		t.namespace("Version", accessExpressionFix({
			moduleName: "sap/base/util/Version",
		})),
		t.namespace("syncStyleClass", accessExpressionFix({
			moduleName: "sap/ui/core/syncStyleClass",
		})),
		// f.namespace("setObject", accessExpressionFix({
		// 	// TODO: Needs to use "exportCodeToBeUsed" prop as the first argument MUST be patched to be a string
		// 	// moduleName: "sap/base/util/ObjectPath",
		// })),
		t.namespace("containsOrEquals", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/542
			moduleName: "sap/ui/dom/containsOrEquals",
		})),
		t.namespace("denormalizeScrollBeginRTL", accessExpressionFix({
			moduleName: "sap/ui/dom/denormalizeScrollBeginRTL",
		})),
		t.namespace("denormalizeScrollLeftRTL", accessExpressionFix({
			moduleName: "sap/ui/dom/denormalizeScrollLeftRTL",
		})),
		t.namespace("ownerWindow", accessExpressionFix({
			moduleName: "sap/ui/dom/getOwnerWindow",
		})),
		t.namespace("scrollbarSize", accessExpressionFix({
			moduleName: "sap/ui/dom/getScrollbarSize",
		})),
		t.namespace("includeScript", accessExpressionFix({
			moduleName: "sap/ui/dom/includeScript",
		})),
		t.namespace("includeStyleSheet", accessExpressionFix({
			moduleName: "sap/ui/dom/includeStylesheet",
		})),
		t.namespace("pxToRem", accessExpressionFix({
			moduleName: "sap/ui/dom/units/Rem",
			propertyAccess: "fromPx",
		})),
		t.namespace("remToPx", accessExpressionFix({
			moduleName: "sap/ui/dom/units/Rem",
			propertyAccess: "toPx",
		})),
		t.namespace("checkMouseEnterOrLeave", accessExpressionFix({ // https://github.com/SAP/ui5-linter/issues/543
			moduleName: "sap/ui/events/checkMouseEnterOrLeave",
		})),
		t.namespace("bindAnyEvent", accessExpressionFix({
			scope: FixScope.FirstChild,
			moduleName: "sap/ui/events/ControlEvents",
		})),
		t.namespace("unbindAnyEvent", accessExpressionFix({
			scope: FixScope.FirstChild,
			moduleName: "sap/ui/events/ControlEvents",
		})),
		t.namespace("ControlEvents", accessExpressionFix({
			moduleName: "sap/ui/events/ControlEvents",
			propertyAccess: "events",
		})),
		t.namespace("handleF6GroupNavigation", accessExpressionFix({
			scope: FixScope.FirstChild,
			moduleName: "sap/ui/events/F6Navigation",
		})),
		t.namespace("touchEventMode", accessExpressionFix({
			scope: FixScope.FirstChild,
			moduleName: "sap/ui/events/jquery/EventSimulation",
		})),
		t.namespace("keycodes", accessExpressionFix({
			moduleName: "sap/ui/events/KeyCodes",
		})),
		t.namespace("PseudoEvents", accessExpressionFix({
			moduleName: "sap/ui/events/PseudoEvents",
			propertyAccess: "events",
		})),
		t.namespace("disableTouchToMouseHandling", accessExpressionFix({
			scope: FixScope.FirstChild,
			moduleName: "sap/ui/events/TouchToMouseMapping",
		})),
		t.namespace("measure", [ // https://github.com/SAP/ui5-linter/issues/555
			t.namespace("getRequestTimings", callExpressionGeneratorFix({
				globalName: "performance",
				generator(ctx, moduleIdentifierName) {
					return `${moduleIdentifierName}.getEntriesByType("resource")`;
				},
			})),
			t.namespace("clearRequestTimings", accessExpressionFix({
				globalName: "performance",
				propertyAccess: "clearResourceTimings",
			})),
			t.namespace("setRequestBufferSize", accessExpressionFix({
				globalName: "performance",
				propertyAccess: "setResourceTimingBufferSize",
			})),
			t.namespace("start", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("add", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("end", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("average", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("clear", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("filterMeasurements", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("getAllMeasurements", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("getMeasurement", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("pause", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("resume", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("getActive", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("setActive", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("remove", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("registerMethod", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("unregisterMethod", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("unregisterAllMethods", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/Measurement",
			})),
			t.namespace("clearInteractionMeasurements", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "clear",
			})),
			t.namespace("startInteraction", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "start",
			})),
			t.namespace("endInteraction", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "end",
			})),
			t.namespace("filterInteractionMeasurements", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "filter",
			})),
			t.namespace("getAllInteractionMeasurements", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "getAll",
			})),
			t.namespace("getPendingInteractionMeasurement", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Interaction",
				propertyAccess: "getPending",
			})),
		]), // measure
		t.namespace("fesr", [ // https://github.com/SAP/ui5-linter/issues/561
			t.namespace("setActive", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/FESR",
			})),
			t.namespace("getActive", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/FESR",
			})),
			t.namespace("addBusyDuration", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			t.namespace("getCurrentTransactionId", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Passport",
			})),
			t.namespace("getRootId", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Passport",
			})),
		]),
		t.namespace("interaction", [
			t.namespace("getActive", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			t.namespace("setActive", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			t.namespace("notifyStepStart", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			t.namespace("notifyStepEnd", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			t.namespace("notifyEventStart", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			t.namespace("notifyScrollEvent", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			t.namespace("notifyEventEnd", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
			t.namespace("setStepComponent", accessExpressionFix({
				scope: FixScope.FirstChild,
				moduleName: "sap/ui/performance/trace/Interaction",
			})),
		]), // interaction
		t.namespace("passport", [
			t.namespace("setActive", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Passport",
				propertyAccess: "setActive",
			})),
			t.namespace("traceFlags", accessExpressionFix({
				moduleName: "sap/ui/performance/trace/Passport",
				propertyAccess: "traceFlags",
			})),
		]),
		t.namespace("initMobile", accessExpressionFix({
			moduleName: "sap/ui/util/Mobile",
			propertyAccess: "init",
		})),
		t.namespace("setIcons", accessExpressionFix({
			moduleName: "sap/ui/util/Mobile",
			propertyAccess: "setIcons",
		})),
		t.namespace("setMobileWebAppCapable", accessExpressionFix({
			moduleName: "sap/ui/util/Mobile",
			propertyAccess: "setWebAppCapable",
		})),
		t.namespace("storage", [
			t.namespace("Storage", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
			})),
			t.namespace("Type", [
				t.namespace("local", accessExpressionFix({
					moduleName: "sap/ui/util/Storage",
					propertyAccess: "Type.local",
				})),
				t.namespace("session", accessExpressionFix({
					moduleName: "sap/ui/util/Storage",
					propertyAccess: "Type.session",
				})),
			]),
			t.namespace("isSupported", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "isSupported",
			})),
			t.namespace("clear", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "clear",
			})),
			t.namespace("get", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "get",
			})),
			t.namespace("getType", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "getType",
			})),
			t.namespace("put", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "put",
			})),
			t.namespace("remove", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "remove",
			})),
			t.namespace("removeAll", accessExpressionFix({
				moduleName: "sap/ui/util/Storage",
				propertyAccess: "removeAll",
			})),
		], callExpressionFix({
			moduleName: "sap/ui/util/Storage",
			newExpression: true,
		})),
		t.namespace("getParseError", accessExpressionFix({
			scope: FixScope.FirstChild,
			moduleName: "sap/ui/util/XMLHelper",
		})),
		t.namespace("parseXML", accessExpressionFix({
			moduleName: "sap/ui/util/XMLHelper",
			propertyAccess: "parse",
		})),
		t.namespace("serializeXML", accessExpressionFix({
			moduleName: "sap/ui/util/XMLHelper",
			propertyAccess: "serialize",
		})),
		t.namespace("startsWith", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "$1.startsWith($2)",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			generator: (ctx, _, arg1, arg2) => {
				return `${arg1}.startsWith(${arg2})`;
			},
		})),
		t.namespace("startsWithIgnoreCase", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "$1.toUpperCase().startsWith($2.toUpperCase())",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			generator: (ctx, _, arg1, arg2) => {
				return `${arg1}.toUpperCase().startsWith(${arg2}.toUpperCase())`;
			},
		})),
		t.namespace("endsWith", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "$1.endsWith($2)",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			generator: (ctx, _, arg1, arg2) => {
				return `${arg1}.endsWith(${arg2})`;
			},
		})),
		t.namespace("endsWithIgnoreCase", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "$1.toUpperCase().endsWith($2.toUpperCase())",
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			generator: (ctx, _, arg1, arg2) => {
				return `${arg1}.toUpperCase().endsWith(${arg2}.toUpperCase())`;
			},
		})),
		t.namespace("padLeft", callExpressionGeneratorFix<{defaultString: boolean}>({
			// exportCodeToBeUsed: "$1.padStart($3, $2)",
			validateArguments: (ctx, checker, arg1, arg2) => {
				if (arg1 && !ts.isStringLiteralLike(arg1)) {
					ctx.defaultString = true;
				}
				if (!arg2 || !ts.isStringLiteralLike(arg2) ||
					// String literals are enclosed in double quotes, so the length of an empty string is 2
					arg2.text.length > 3) {
					// API not compatible if the second argument is not a string or string with length <> 1
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
		t.namespace("padRight", callExpressionGeneratorFix<{defaultString: boolean}>({
			// exportCodeToBeUsed: "$1.padEnd($3, $2)",
			validateArguments: (ctx, checker, arg1, arg2) => {
				if (arg1 && !ts.isStringLiteralLike(arg1)) {
					ctx.defaultString = true;
				}
				if (!arg2 || !ts.isStringLiteralLike(arg2) ||
					// String literals are enclosed in double quotes, so the length of an empty string is 2
					arg2.text.length > 3) {
					// API not compatible if the second argument is not a string or string with length <> 1
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
		t.namespace("domById", callExpressionGeneratorFix({
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
		t.namespace("isEqualNode", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "!!$1?.isEqualNode($2)",
			generator: (ctx, _, arg1, arg2) => {
				return `!!${arg1}?.isEqualNode(${arg2})`;
			},
		})),
		t.namespace("newObject", callExpressionGeneratorFix({
			validateArguments: () => {
				// TODO: Add checks, see codeReplacer.ts
				return true;
			},
			// exportCodeToBeUsed: "Object.create($1)",
			generator: (ctx, _, arg1) => {
				return `Object.create(${arg1})`;
			},
		})),
		t.namespace("getter", callExpressionGeneratorFix({
			// exportCodeToBeUsed: "((value) => () => value)($1)",
			generator: (ctx, _, arg1) => {
				return `((value) => () => value)(${arg1})`;
			},
		})),
		t.namespace("getModulePath", callExpressionGeneratorFix({ // https://github.com/SAP/ui5-linter/issues/589
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
		t.namespace("getResourcePath", callExpressionGeneratorFix({
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
			scope: FixScope.FullExpression,
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
			scope: FixScope.FullExpression,
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
			this.argStringValue = stringArg.getFullText();
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
