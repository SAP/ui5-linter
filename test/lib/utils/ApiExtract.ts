import test from "ava";
import {
	// ApiExtractImpl,
	loadApiExtract} from "../../../src/utils/ApiExtract.js";

/* Use the following mock JSON to test metadata reading independently from the actual api-extract.json file:
const apiExtract = new ApiExtractImpl(JSON.parse(`
{
	"framework": {
		"name": "SAPUI5",
		"version": "1.2.3"
	},
	"metadata": {
		"sap.m.App": {
			"property": ["backgroundColor", "backgroundImage"],
			"event": ["orientationChange"],
			"method": ["getBackgroundColor"],
			"extends": "sap.m.NavContainer"
		},
		"sap.m.NavContainer": {
			"property": ["autoFocus"],
			"aggregation": ["pages"],
			"association": ["initialPage"],
			"defaultAggregation": "pages",
			"event": ["afterNavigate"],
			"method": ["addPage"],
			"extends": "sap.ui.core.Control"
		},
		"sap.ui.core.Element": {
			"aggregation": ["tooltip"],
			"property": ["tooltip"]
		}
	},
	"deprecations": {
		"UI5Class": {
			"sap.f.Avatar": "(since 1.73) Use the {@link sap.m.Avatar} instead."
		}
	}
}`)); */
const apiExtract = await loadApiExtract();

test("Test doesOptionExist()", (t) => {
	t.is(apiExtract.doesOptionExist("sap.m.App", "pages", "aggregation"), true,
		"'pages' is a borrowed aggregation of 'sap.m.NavContainer'");
	t.is(apiExtract.doesOptionExist("sap.m.NavContainer", "pages", "aggregation"), true,
		"'pages' is an aggregation of 'sap.m.NavContainer'");
	t.is(apiExtract.doesOptionExist("sap.m.NavContainer", "pages", "aggregation", false), true,
		"'pages' is an aggregation of 'sap.m.NavContainer'");
	t.is(apiExtract.doesOptionExist("sap.m.App", "backgroundColor", "aggregation"), false,
		"'backgroundColor' is a property and not an aggregation of 'sap.m.App'");
	t.is(apiExtract.doesOptionExist("sap.m.App", "tooltip", "aggregation"), true,
		"'tooltip' is an aggregation of 'sap.ui.core.Element'");
	t.is(apiExtract.doesOptionExist("sap.xyz.notExistingSymbol", "backgroundColor", "property"), false,
		"If the symbol can't be found, false should be returned");
	t.is(apiExtract.doesOptionExist("sap.m.App", "notExistingOption", "property"), false,
		"If the option can't be found, false should be returned");
});

test("Test getAllOptionsByType()", (t) => {
	const result = apiExtract.getAllOptionsByType("sap.m.App", "property", false);
	const result2 = apiExtract.getAllOptionsByType("sap.m.App", "property");
	const result3 = apiExtract.getAllOptionsByType("sap.m.App", "property", true);

	t.truthy((Array.isArray(result) && result.length),
		"All properties of 'sap.m.App' should be returned as an array");
	t.truthy((Array.isArray(result) && Array.isArray(result2) && result2.length > result.length),
		"All properties of 'sap.m.App' and its borrowed ones should be returned as an array");
	t.deepEqual(result2, result3, "All properties of 'sap.m.App' should be returned as an array");
	t.deepEqual(apiExtract.getAllOptionsByType("sap.m.App", "defaultAggregation", false), [],
		"If no options for the given type can be found, an empty array should be returned");
	t.deepEqual(apiExtract.getAllOptionsByType("sap.m.App", "event", false), ["orientationChange"],
		"'orientationChange' is the only event of 'sap.m.App' (but deprecated)");
	t.is(apiExtract.getAllOptionsByType("sap.xyz.notExistingSymbol", "property", false), undefined,
		"If the symbol can't be found, undefined should be returned");
	t.is(apiExtract.getAllOptionsByType("sap.xyz.notExistingSymbol", "property", true), undefined,
		"If the symbol can't be found, undefined should be returned");
});

test("Test option type-specific methods", (t) => {
	t.is(apiExtract.isAggregation("sap.m.App", "pages"), true,
		"'pages' is a borrowed aggregation of 'sap.m.NavContainer'");
	t.is(apiExtract.isAggregation("sap.m.NavContainer", "pages"), true,
		"'pages' is an aggregation of 'sap.m.NavContainer'");
	t.is(apiExtract.isAggregation("sap.m.NavContainer", "pages", false), true,
		"'pages' is an aggregation of 'sap.m.NavContainer'");
	t.is(apiExtract.isAggregation("sap.m.App", "backgroundColor", false), false,
		"'backgroundColor' is a property and not an aggregation of 'sap.m.App'");
	t.is(apiExtract.isAggregation("sap.xyz.notExistingSymbol", "backgroundColor"), false,
		"If the symbol can't be found, false should be returned");

	t.is(apiExtract.isAssociation("sap.m.App", "initialPage"), true,
		"'initialPage' is a borrowed association of 'sap.m.NavContainer'");
	t.is(apiExtract.isAssociation("sap.m.NavContainer", "initialPage"), true,
		"'initialPage' is an association of 'sap.m.NavContainer'");
	t.is(apiExtract.isAssociation("sap.m.NavContainer", "initialPage", false), true,
		"'initialPage' is an aggregation of 'sap.m.NavContainer'");
	t.is(apiExtract.isAssociation("sap.m.App", "backgroundColor", false), false,
		"'backgroundColor' is a property and not an association of 'sap.m.App'");
	t.is(apiExtract.isAssociation("sap.xyz.notExistingSymbol", "initialPage"), false,
		"If the symbol can't be found, false should be returned");

	t.is(apiExtract.isEvent("sap.m.App", "afterNavigate"), true,
		"'afterNavigate' is a borrowed event of 'sap.m.NavContainer'");
	t.is(apiExtract.isEvent("sap.m.NavContainer", "afterNavigate"), true,
		"'afterNavigate' is an event of 'sap.m.NavContainer'");
	t.is(apiExtract.isEvent("sap.m.NavContainer", "afterNavigate", false), true,
		"'afterNavigate' is an event of 'sap.m.NavContainer'");
	t.is(apiExtract.isEvent("sap.m.App", "backgroundColor", false), false,
		"'backgroundColor' is a property and not an event of 'sap.m.App'");
	t.is(apiExtract.isEvent("sap.xyz.notExistingSymbol", "afterNavigate"), false,
		"If the symbol can't be found, false should be returned");

	/* Disabled as "methods" not being required:
	t.is(apiExtract.isMethod("sap.m.App", "getBackgroundColor"), true,
		"'getBackgroundColor' is a method of 'sap.m.App'");
	t.is(apiExtract.isMethod("sap.m.NavContainer", "addPage"), true,
		"'addPage' is a borrowed method of 'sap.m.NavContainer'");
	t.is(apiExtract.isMethod("sap.m.NavContainer", "addPage", false), true,
		"'addPage' is a method of 'sap.m.NavContainer'");
	t.is(apiExtract.isMethod("sap.m.App", "backgroundColor", false), false,
		"'backgroundColor' is a property and not a method of 'sap.m.App'");
	t.is(apiExtract.isMethod("sap.xyz.notExistingSymbol", "getBackgroundColor"), false,
		"If the symbol can't be found, false should be returned");
	*/

	t.is(apiExtract.isProperty("sap.m.App", "backgroundColor"), true,
		"'backgroundColor' is a property of 'sap.m.App'");
	t.is(apiExtract.isProperty("sap.m.App", "backgroundColor", true), true,
		"'backgroundColor' is a property of 'sap.m.App'");
	t.is(apiExtract.isProperty("sap.m.App", "autoFocus", true), true,
		"'autoFocus' is a property of 'sap.m.App'");
	t.is(apiExtract.isProperty("sap.m.App", "backgroundColor", false), true,
		"'backgroundColor' is a property of 'sap.m.App'");
	t.is(apiExtract.isProperty("sap.m.App", "pages", false), false,
		"'pages' is an aggregation and not a property of 'sap.m.App'");
	t.is(apiExtract.isProperty("sap.xyz.notExistingSymbol", "backgroundColor"), false,
		"If the symbol can't be found, false should be returned");

	t.is(apiExtract.getTypeByOption("sap.m.App", "pages"), "aggregation",
		"'pages' is the default aggregation of 'sap.m.App'");
	t.is(apiExtract.getTypeByOption("sap.m.App", "pages", false), undefined,
		`'pages' is a borrowed default aggregation of 'sap.m.NavContainer',
hence it should not be found in 'sap.m.App'`);
	t.is(apiExtract.getTypeByOption("sap.m.App", "notExistingOptionType"), undefined,
		"If the option type can't be found, undefined should be returned");
	t.is(apiExtract.getTypeByOption("sap.ui.base.Object", "backgroundColor"), undefined,
		"'sap.ui.base.Object' does not have any options, hence undefined should be returned");
	t.is(apiExtract.getTypeByOption("sap.xyz.notExistingSymbol", "backgroundColor"), undefined,
		"If the symbol can't be found, undefined should be returned");

	// Test aggregation exception:
	t.true(apiExtract.isAggregation("sap.ui.core.Element", "tooltip") &&
		apiExtract.isProperty("sap.ui.core.Element", "tooltip"),
	"'tooltip' is an aggregation and a property of 'sap.ui.core.Element'");
});

test("Test getDefaultAggregation()", (t) => {
	t.is(apiExtract.getDefaultAggregation("sap.m.App"), "pages", "The default aggregation of 'sap.m.App' is 'pages'");
	t.is(apiExtract.getDefaultAggregation("sap.m.NavContainer"), "pages",
		"The default aggregation of 'sap.m.NavContainer' is 'pages'");
	t.is(apiExtract.getDefaultAggregation("sap.ui.base.Object"), undefined,
		"'sap.ui.base.Object' does not have a default aggregation");
	t.is(apiExtract.getDefaultAggregation("sap.xyz.notExistingSymbol"), undefined,
		"If the symbol can't be found, undefined should be returned");
});

test("Test getDeprecationInfo()", (t) => {
	t.deepEqual(apiExtract.getDeprecationInfo("sap.f.Avatar"), {
		symbolKind: "UI5Class",
		text: "(since 1.73) Use the {@link sap.m.Avatar} instead.",
	}, "The deprecation info object for 'sap.f.Avatar' should be returned");
	t.is(apiExtract.getDeprecationInfo("sap.m.App"), undefined,
		"'sap.m.App' is not listed in deprecations, hence undefined should be returned");
});
