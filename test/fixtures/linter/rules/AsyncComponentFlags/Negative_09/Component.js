sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/core/library"], function (UIComponent, coreLib) {
	"use strict";

	return UIComponent.extend("mycomp.Component", {
		"metadata": {
			"interfaces": [coreLib.IAsyncContentCreation],
			"manifest": "json",
		},
	});
});
