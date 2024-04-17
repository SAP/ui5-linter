import test from "ava";
import deprecatedLibs from "../../../src/utils/deprecatedLibs.js";

test("Test Deprecated Libs constant", (t) => {
	const expectedDeprecatedLibs: string[] = [
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
	];
	t.deepEqual(deprecatedLibs, expectedDeprecatedLibs,
		"Expected deprecated libraries list should match the actual list.");
});