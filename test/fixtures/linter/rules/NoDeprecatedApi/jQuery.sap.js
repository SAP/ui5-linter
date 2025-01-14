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

	// Access to jQuery.sap (e.g. when stubbing functions in tests)
	sinon.stub(jQuery.sap, "properties"); // jQuery.sap is deprecated
	sinon.stub(importedJQuery.sap, "properties"); // jQuery.sap is deprecated
	sinon.stub(importedJQuerySapProperties.sap, "properties"); // jQuery.sap is deprecated

	// Access to jQuery.sap without calling a function
	const jQuerySap1 = jQuery.sap; // jQuery.sap is deprecated
	const jQuerySap2 = importedJQuery.sap; // jQuery.sap is deprecated
	const jQuerySap3 = importedJQuerySapProperties.sap; // jQuery.sap is deprecated
});
