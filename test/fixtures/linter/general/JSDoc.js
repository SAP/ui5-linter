sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/UIComponent", "sap/ui/core/routing/History", "sap/m/Button"],
	/**
	 * @param {typeof import('sap/ui/core/mvc/Controller').default} Controller
	 * @param {typeof import('sap/ui/core/UIComponent').default} UIComponent
	 * @param {typeof import('sap/ui/core/routing/History').default} History
	 * @param {typeof import('sap/m/Button').default} Button
	 */
	function (Controller, UIComponent, History, Button) {
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
