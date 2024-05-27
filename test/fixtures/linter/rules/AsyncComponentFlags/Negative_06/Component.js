// IAsyncContentCreation interface is implemented, no redundant async flags in inline manifest of parent component
sap.ui.define(["mycomp/subdir/ParentComponent"], function (ParentComponent) {
	"use strict";

	return ParentComponent.extend("mycomp.Component", {
		metadata: {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
		},
	});
});
