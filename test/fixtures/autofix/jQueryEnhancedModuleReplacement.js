sap.ui.define(["sap/ui/thirdparty/jquery"], async function (jQuery) {
	// https://github.com/SAP/ui5-linter/issues/531
	var isLandscape = jQuery.device.is.landscape;
	var isPortait = jQuery.device.is.portrait;
	var isDesktop = jQuery.device.is.desktop;
	var isPhone = jQuery.device.is.phone;
	var isTablet = jQuery.device.is.tablet;
	var isAndroidPhone = jQuery.device.is.android_phone;
	var isAndroidTablet = jQuery.device.is.android_tablet;
	var isIPhone = jQuery.device.is.iphone;
	var isIPad = jQuery.device.is.ipad;

	// https://github.com/SAP/ui5-linter/issues/532
	var osName = jQuery.os.os;
	var osVersion = jQuery.os.fVersion;
	var osVersionString = jQuery.os.version;
	var isAndroid = jQuery.os.Android;
	var isBlueBerry = jQuery.os.bb;
	var isIOS = jQuery.os.iOS;
	var isWinPhone = jQuery.os.winphone;
	var isWin = jQuery.os.win;
	var isLinux = jQuery.os.linux;
	var isMac = jQuery.os.mac;

	// https://github.com/SAP/ui5-linter/issues/588
	jQuery.sap.registerModulePath("ui5.project.moduleA", "/ui5/project/moduleA");
	jQuery.sap.registerModulePath("ui5.project.moduleB", { path: "/ui5/project/moduleB" });
	var moduleName = "ui5.project.moduleC";
	jQuery.sap.registerModulePath(moduleName, { path: "/ui5/project/moduleC" });

	jQuery.sap.registerResourcePath("me/fancy/A", "ui5/projectA/");
	jQuery.sap.registerResourcePath("me/fancy/B", { url: 'ui5/projectB/' });

	// https://github.com/SAP/ui5-linter/issues/589
	var buttonPath1 = jQuery.sap.getModulePath("sap.m.Button", ".js"); // resolves to "resources/sap/m/Button.js"
	var buttonPath2 = jQuery.sap.getModulePath("sap.m.Button", "/"); // resolves to  "resources/sap/m/Button/"
	var buttonPath3 = jQuery.sap.getModulePath("sap.m.Button", ""); // resolves to "resources/sap/m/Button"
	var buttonPath3 = jQuery.sap.getModulePath(["sap", "m", "Button"].join("."), ""); // resolves to "resources/sap/m/Button"
	var buttonPath3 = jQuery.sap.getModulePath("sap." + "m." + "Button", ".js"); // resolves to "resources/sap/m/Button.js"
	
	var buttonPath4 = jQuery.sap.getResourcePath("sap/m/Button.js"); // resolves to "resources/sap/m/Button.js"
	var buttonPath5 = jQuery.sap.getResourcePath("sap.m/Button.js"); // resolves to "resources/sap.m/Button.js"
	var buttonPath1 = jQuery.sap.getModulePath("sap/m/Button", ".js"); // resolves to "resources/sap/m/Button.js"
	var buttonPath2 = jQuery.sap.getModulePath("sap/m/Button", "/"); // resolves to  "resources/sap/m/Button/"
	var buttonPath3 = jQuery.sap.getModulePath("sap/m/Button", ""); // resolves to "resources/sap/m/Button"
	var oMainDataSource = {settings: {localUri: "sap.ui.core.odata.v2.metadata.xml"}};
	jQuery.sap.getModulePath(oMainDataSource.settings.localUri.replace(".xml", ""), ".xml");

	// https://github.com/SAP/ui5-linter/issues/530
	var currentParams = jQuery.sap.getUriParameters();
	var paramsByUrl = jQuery.sap.getUriParameters("/service?x=1&y=2&z=true");
});
