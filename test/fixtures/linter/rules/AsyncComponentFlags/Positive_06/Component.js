// Fixture description:
// IAsyncContentCreation interface is implemented, redundant async flag (rootView only) in manifest.json
// No manifest: "json" configuration in metadata
sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
	"use strict";

	return UIComponent.extend("mycomp.Component", {
		metadata: {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
		},
	});
});
