(function (factory) {
	if (sap.ui.define) {
		sap.ui.define(
			[
				"sap/ui/core/mvc/Controller",
				"sap/ui/core/UIComponent",
				"sap/ui/core/routing/History",
			],
			factory
		);
	}
})(function (Controller) {
	return Controller.extend("MyController", {});
});
