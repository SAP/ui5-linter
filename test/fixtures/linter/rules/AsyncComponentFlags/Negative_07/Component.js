// Inheriting from sap/fe/core/AppComponent (implements IAsyncContentCreation interface), no redundant async flags in manifest
sap.ui.define(["sap/fe/core/AppComponent"], function (Component) {
	"use strict";

	return Component.extend("mycomp.Component", {
		metadata: {
			manifest: "json",
		},
	});
});
