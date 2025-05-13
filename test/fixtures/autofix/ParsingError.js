sap.ui.define([], function () {

	jQuery.sap.assert(true, "That's an assert");

	// This syntax error should be detected and the file should not be attempted to be fixed, i.e. no autofix-error should be reported
	jQuery.sap.assert(true, "That's an assert", {}

});
