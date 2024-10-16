sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/UIComponent", "sap/ui/core/routing/History", "sap/m/Button"],
	function (Controller, UIComponent, History, Button) {
	"use strict";

	/**
	 * @class JSDoc comments should be removed, as it might have negative impact on the type detection
	 */
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
