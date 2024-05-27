// Component which does not inherit from UIComponent (this should actually not be analyzed)
sap.ui.define(["sap/ui/core/Component"], function (Component) {
	"use strict";

	return Component.extend("mycomp.Component", {
		"metadata": {
			"manifest": "json",
		},
	});
});
