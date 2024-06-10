import test from "ava";
import {
	deprecatedLibraries,
	deprecatedThemeLibraries,
	deprecatedComponents,
} from "../../../src/utils/deprecations.js";

test("Test deprecatedLibraries constant", (t) => {
	const expectedDeprecatedLibraries: string[] = [
		"sap.ca.scfld.md",
		"sap.ca.ui",
		"sap.fe.common", // Internal, removed in 1.110
		"sap.fe.plugins", // Internal, removed in 1.102
		"sap.fe.semantics", // Internal, removed in 1.104
		"sap.landvisz", // Removed in 1.120
		"sap.makit",
		"sap.me",
		"sap.sac.grid", // Removed in 1.114
		"sap.ui.commons",
		"sap.ui.suite",
		"sap.ui.ux3",
		"sap.ui.vtm",
		"sap.uiext.inbox",
		"sap.webanalytics.core",
		"sap.zen.commons",
		"sap.zen.crosstab",
		"sap.zen.dsh",
		"sap.ui.webc.common", // as of 1.120.16 (SAPUI5 distribution 1.120.15)
		"sap.ui.webc.fiori", // as of 1.120.16 (SAPUI5 distribution 1.120.15)
		"sap.ui.webc.main", // as of 1.120.16 (SAPUI5 distribution 1.120.15)
	];
	t.deepEqual(deprecatedLibraries, expectedDeprecatedLibraries,
		"Expected deprecated libraries list should match the actual list.");
});

test("Test deprecatedThemeLibraries constant", (t) => {
	const expectedDeprecatedThemeLibraries: string[] = [
		"themelib_sap_belize",
		"themelib_sap_bluecrystal",
	];
	t.deepEqual(deprecatedThemeLibraries, expectedDeprecatedThemeLibraries,
		"Expected deprecated theme-libraries list should match the actual list.");
});

test("Test deprecatedComponents constant", (t) => {
	const expectedDeprecatedComponents: string[] = [
		"sap.zen.dsh.fioriwrapper",
	];
	t.deepEqual(deprecatedComponents, expectedDeprecatedComponents,
		"Expected deprecated components list should match the actual list.");
});
