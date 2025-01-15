sap.ui.define(["./BaseController", "sap/m/BackgroundDesign"],
	function (BaseController, BackgroundDesign) {
	"use strict";

	return BaseController.extend("com.ui5.troublesome.app.controller.App", {
		onInit: function () {
			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			this.createButton().attachTap(function() {
				console.log("Tapped");
			});

			this.loadFragment({
				type: "HTML", // Deprecated type "HTML"
				name: "com.ui5.troublesome.app.view.MyFragment"
			});
		}
	});
});
