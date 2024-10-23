// Component which does not inherit from UIComponent:
// IAsyncContentCreation / rootView / routing should not be analyzed
sap.ui.define(["sap/ui/core/Component"], function (Component) {
	"use strict";

	return Component.extend("mycomp.Component", {
		"metadata": {
			"manifest": "json",
		},
	});
});
