// Fixture description:
// - IAsyncContentCreation interface is implemented, no redundant async flags in manifest.json
// - Component module contains additional local class (MyType) that does not inherit from the UI5 Component
sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/model/type/Unit"], function (UIComponent, UnitType) {
	"use strict";

	const MyType = UnitType.extend("mycomp.MyType", {});

	return UIComponent.extend("mycomp.Component", {
		metadata: {
			"interfaces": ["sap.ui.core.IAsyncContentCreation"],
			"manifest": "json",
		},
	});
});
