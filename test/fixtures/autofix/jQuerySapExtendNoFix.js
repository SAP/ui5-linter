sap.ui.define([], function() {

	// Definitions of jQuery.sap.extend API should be ignored
	jQuery.sap.extend = function() {};

	// Assignment of jQuery.sap.extend API should also be ignored as replacement depends on the first argument
	const extend = jQuery.sap.extend;
});
