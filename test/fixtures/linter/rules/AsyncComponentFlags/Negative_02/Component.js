// Fixture description:
// Async flags are maintained in manifest.json
sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
	"use strict";

	return UIComponent.extend("mycomp.Component", {
		metadata: {
			manifest: "json",
		},
	});
});
