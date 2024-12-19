import test from "ava";
import {ApiExtractImpl} from "../../../src/utils/ApiExtract.js";

const mockApiJSON = `
{
	"framework": {
		"name": "SAPUI5",
		"version": "1.2.3"
	},
	"metadata": {
		"sap.m.App": {
			"properties": ["backgroundColor", "backgroundImage"],
			"extends": "sap.m.NavContainer"
		},
		"sap.m.NavContainer": {
			"properties": ["autoFocus"],
			"defaultAggregation": "pages",
			"extends": "sap.ui.core.Control"
		},
		"sap.ui.base.Object": {}
	},
	"deprecations": {
		"UI5Class": {
			"sap.f.Avatar": "(since 1.73) Use the {@link sap.m.Avatar} instead."
		}
	}
}`;

const apiExtract = new ApiExtractImpl(JSON.parse(mockApiJSON));

test("Test getAllOptionsByType()", (t) => {
	t.deepEqual(apiExtract.getAllOptionsByType("sap.m.App", "properties", false),
		["backgroundColor", "backgroundImage"],
		"All properties of 'sap.m.App' should be returned as an array");
	t.deepEqual(apiExtract.getAllOptionsByType("sap.m.App", "properties", true),
		["backgroundColor", "backgroundImage", "autoFocus"],
		"All properties of 'sap.m.App' and its borrowed ones should be returned as an array");
	t.deepEqual(apiExtract.getAllOptionsByType("sap.m.NavContainer", "properties", false), ["autoFocus"],
		"All properties of 'sap.m.NavContainer' should be returned as an array");
	t.deepEqual(apiExtract.getAllOptionsByType("sap.ui.base.Object", "properties", false), [],
		"If no option values could be found, an empty array should be returned");
	t.is(apiExtract.getAllOptionsByType("sap.xyz.notExistingSymbol", "properties", false), undefined,
		"If the symbol can't be found, undefined should be returned");
	t.is(apiExtract.getAllOptionsByType("sap.xyz.notExistingSymbol", "properties", true), undefined,
		"If the symbol can't be found, undefined should be returned");
});

test("Test getTypeByOption()", (t) => {
	t.is(apiExtract.getTypeByOption("sap.m.App", "backgroundColor", false), "properties",
		"'backgroundColor' is a property of 'sap.m.App'");
	t.is(apiExtract.getTypeByOption("sap.m.App", "pages", true), "defaultAggregation",
		"'pages' is the default aggregation of 'sap.m.App'");
	t.is(apiExtract.getTypeByOption("sap.m.App", "notExistingOptionType", true), undefined,
		"If the option type can't be found, undefined should be returned");
	t.is(apiExtract.getTypeByOption("sap.ui.base.Object", "backgroundColor", true), undefined,
		"'sap.ui.base.Object' does not have any options, hence undefined should be returned");
	t.is(apiExtract.getTypeByOption("sap.xyz.notExistingSymbol", "backgroundColor", true), undefined,
		"If the symbol can't be found, undefined should be returned");
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
