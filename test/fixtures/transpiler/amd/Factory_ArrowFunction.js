const factory = (Controller) => {
	// This comment should be above the "class" statement of MyController after transpiling
	return Controller.extend("MyController", {});
	// This comment should be below the "class" statement of MyController after transpiling
};

sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/UIComponent",
		"sap/ui/core/routing/History",
	],
	factory
);
