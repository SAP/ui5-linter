import Controller from "sap/ui/core/mvc/Controller";
import Button from "sap/m/Button";

export default function () {
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
}
