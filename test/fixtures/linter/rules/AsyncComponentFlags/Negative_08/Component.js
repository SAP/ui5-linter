// No rootView or router config and no IAsyncContentCreation interface implemented
sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
	"use strict";

	return UIComponent.extend("mycomp.Component", {
		"metadata": {
			"manifest": "json",
		},
	});
});
