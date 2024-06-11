import type _Button from "sap/m/Button";
import type _UIComponent from "sap/ui/core/UIComponent";
import type _Controller from "sap/ui/core/mvc/Controller";
import type _History from "sap/ui/core/routing/History";

sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/UIComponent", "sap/ui/core/routing/History", "sap/m/Button"],
	function (Controller: typeof _Controller, UIComponent: typeof _UIComponent, History: typeof _History, Button: typeof _Button) {
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
