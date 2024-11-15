sap.ui.define([
	"sap/ui/core/Control",

	// NOTE: For this test case it is important to use the full namespace, not a relative import here.
	// It makes a difference on how TypeScript resolves types and how SourceFileLinter analyses the renderer declaration
	"sap/f/ProductSwitchRenderer"
], function (Control, ProductSwitchRenderer) {
	"use strict";
	var ProductSwitch = Control.extend("sap.f.ProductSwitch", {
		renderer: ProductSwitchRenderer
	});
	return ProductSwitch;
});
