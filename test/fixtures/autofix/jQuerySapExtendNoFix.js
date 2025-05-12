sap.ui.define([], function() {

	// Definitions of jQuery.sap.extend API should be ignored
	jQuery.sap.extend = function() {};

	// Assignment of jQuery.sap.extend API should also be ignored as replacement depends on the first argument
	const extend = jQuery.sap.extend;

	// TODO: Also, as no API usage can't be fixed, there should NOT be a new import added to the module
});
