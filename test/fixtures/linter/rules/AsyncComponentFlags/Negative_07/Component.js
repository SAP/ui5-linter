// Inheriting from sap/fe/core/AppComponent (implements IAsyncContentCreation interface), no redundant async flags in manifest
sap.ui.define(["sap/fe/core/AppComponent"], function (AppComponent) {
	"use strict";

	return AppComponent.extend("mycomp.Component", {
		metadata: {
			manifest: "json",
		},
	});
});
