sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
	"use strict";

	return UIComponent.extend("mycomp.Component", {
		metadata: {
			"interfaces": ["sap.ui.core.IAsyncContentCreation"],
			"manifest": "json",
		},
	});
});
