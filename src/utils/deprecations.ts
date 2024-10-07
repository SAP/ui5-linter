export const deprecatedLibraries: string[] = [
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

export const deprecatedThemeLibraries: string[] = [
	"themelib_sap_belize", // deprecated as of 1.120
	"themelib_sap_bluecrystal", // deprecated as of 1.40
];

// Based on https://ui5.sap.com/#/topic/a87ca843bcee469f82a9072927a7dcdb
export const deprecatedThemes: string[] = [

	// Part of themelib_sap_belize, deprecated as of 1.120
	"sap_belize",
	"sap_belize_plus",
	"sap_belize_hcb",
	"sap_belize_hcw",

	// Part of themelib_sap_bluecrystal, deprecated as of 1.40
	"sap_bluecrystal",

	// Legacy HCB theme, part of every library, deprecated as of 1.46
	"sap_hcb",

	// Legacy themes, removed with 1.48
	"sap_goldreflection",
	"sap_platinum",
	"sap_ux",
];

export const deprecatedComponents: string[] = [
	"sap.zen.dsh.fioriwrapper",
];
