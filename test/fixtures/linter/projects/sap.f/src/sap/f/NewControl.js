sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";
	// This control is used to test cases where a framework library contains a control
	// for which no @sapui5/types exist.
	// The control and usages of it should still be analyzed properly, e.g. when extending it
	// and not defining a renderer.
	return Control.extend("sap.f.NewControl", {
		renderer: null
	});
});
