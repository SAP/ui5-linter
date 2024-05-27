// Fixture description:
// IAsyncContentCreation interface is implemented, redundant async flags in manifest of parent component
sap.ui.define(["mycomp/subdir/ParentComponent"], function (ParentComponent) {
	"use strict";

	return ParentComponent.extend("mycomp.Component", {
		metadata: {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
		},
	});
});
