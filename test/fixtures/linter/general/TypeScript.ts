import Button from "sap/m/Button";
import UIComponent from "sap/ui/core/UIComponent";
import Controller from "sap/ui/core/mvc/Controller";
import History from "sap/ui/core/routing/History";

sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/UIComponent", "sap/ui/core/routing/History", "sap/m/Button"],
	function (Controller: Controller, UIComponent: UIComponent, History: History, Button: Button) {
	"use strict";

	return Controller.extend("com.ui5.troublesome.app.controller.BaseController", {

		createButton: function() {
			var btn = new Button({
				blocked: true
			});
			btn.attachTap(function() {
				console.log("Tapped");
			});
			return btn;
		},
	});
});
