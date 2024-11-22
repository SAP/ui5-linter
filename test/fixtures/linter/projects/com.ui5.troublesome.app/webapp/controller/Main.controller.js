sap.ui.define(["./BaseController", "sap/m/MessageBox"], function (BaseController, MessageBox) {
	"use strict";

	return BaseController.extend("com.ui5.troublesome.app.controller.Main", {
		sayHello: function () {
			MessageBox.show("Hello World!");
		},

		registerButtonEventHandlers() {
			this.byId("helloButton").attachTap(function() {
				console.log("Tapped");
			});

			// testButton exists in two views and could be a sap.m.Button or a sap.ui.commons.Button.
			// For this reason, the detection of deprecated button API does not work
			// but for base control API it should still work.
			const testButton = this.byId("testButton");

			testButton.getBlocked(); // This should be reported

			// This is currently not reported as TypeScript does not know the exact type of testButton
			if (testButton.attachTap) {
				testButton.attachTap(function() {
					console.log("Tapped");
				});
			}
		}
	});
});
