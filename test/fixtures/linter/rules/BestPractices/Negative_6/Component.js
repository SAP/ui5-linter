sap.ui.define(["com/ui5/troublesome/app/ParentComponent"], function (ParentComponent) {
	"use strict";

	return ParentComponent.extend("mycomp.Component", {
		interfaces: ["sap.ui.core.IAsyncContentCreation"],
	});
});
