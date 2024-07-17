sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/UIComponent", "sap/ui/core/routing/History", "sap/m/Button"],
	function (Controller, UIComponent, History, Button) {
	"use strict";

	const BaseController = Controller.extend("com.ui5.troublesome.app.controller.BaseController", {

		createButton: function() {
			var btn = new Button({
				blocked: true
			});
			return btn;
		},
	});

	const btn = new BaseController().createButton();
	btn.attachTap(function() {
		console.log("Tapped");
	});
	return BaseController;
});
