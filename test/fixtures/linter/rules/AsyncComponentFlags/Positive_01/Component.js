// Fixture description:
// No IAsyncContentCreation interface is implemented, no async flags in manifest.json
sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
	"use strict";

	return UIComponent.extend("mycomp.Component", {
		metadata: {
			manifest: "json",
		},
	});
});
