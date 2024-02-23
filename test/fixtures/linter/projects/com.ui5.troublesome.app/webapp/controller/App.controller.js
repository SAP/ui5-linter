sap.ui.define(["./BaseController"],
	function (BaseController) {
	"use strict";

	return BaseController.extend("com.ui5.troublesome.app.controller.App", {
		onInit: function () {
			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			this.createButton().attachTap(function() {
				console.log("Tapped");
			});
		}
	});
});
