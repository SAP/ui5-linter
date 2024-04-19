sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
	"use strict";

	return UIComponent.extend("com.ui5.troublesome.app.Component", {
		interfaces: ["sap.ui.core.IAsyncContentCreation"],
		metadata: {
			manifest: "json",
		},
	});
});
