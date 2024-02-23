const factory = (Controller) => {
	return Controller.extend("MyController", {});
};

sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/UIComponent",
		"sap/ui/core/routing/History",
	],
	factory
);
