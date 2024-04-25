sap.ui.define(["mycomp/ParentComponent"], function (ParentComponent) {
	"use strict";

	return ParentComponent.extend("mycomp.Component", {
		interfaces: ["sap.ui.core.IAsyncContentCreation"],
	});
});
