// Fixture description:
// Async flags are maintained in manifest.json. Inheriting from parent component.
sap.ui.define(["mycomp/subdir/ParentComponent"], function (ParentComponent) {
	"use strict";

	return ParentComponent.extend("mycomp.Component", {
		metadata: {
			manifest: "json",
		},
	});
});
