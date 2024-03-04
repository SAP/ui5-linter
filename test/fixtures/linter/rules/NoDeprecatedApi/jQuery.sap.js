sap.ui.define(["sap/ui/thirdparty/jquery", "jquery.sap.properties"], function(importedJQuery, importedJQuerySapProperties) {

	// Global access
	var oProperties1 = jQuery.sap.properties(); // jQuery.sap.properties is deprecated
	var oProperties2 = jQuery["sap"].properties(); // jQuery.sap.properties is deprecated
	var oProperties3 = jQuery["sap"]["properties"](); // jQuery.sap.properties is deprecated

	// via thirdparty jQuery
	var oProperties1 = importedJQuery.sap.properties(); // jQuery.sap.properties is deprecated
	var oProperties2 = importedJQuery["sap"].properties(); // jQuery.sap.properties is deprecated
	var oProperties3 = importedJQuery["sap"]["properties"](); // jQuery.sap.properties is deprecated

	// via jquery.sap module
	var oProperties1 = importedJQuerySapProperties.sap.properties(); // jQuery.sap.properties is deprecated
	var oProperties2 = importedJQuerySapProperties["sap"].properties(); // jQuery.sap.properties is deprecated
	var oProperties3 = importedJQuerySapProperties["sap"]["properties"](); // jQuery.sap.properties is deprecated
});
