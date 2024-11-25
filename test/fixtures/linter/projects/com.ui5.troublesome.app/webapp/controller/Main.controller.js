sap.ui.define(["./BaseController", "sap/m/MessageBox"], function (BaseController, MessageBox) {
	"use strict";

	return BaseController.extend("com.ui5.troublesome.app.controller.Main", {
		sayHello: function () {
			MessageBox.show("Hello World!");
		},

		registerButtonEventHandlers() {
			// this.byId and this.getView().byId should report the same issues
			this.byId("helloButton").attachTap(function() {
				console.log("Tapped");
			});
			this.getView().byId("helloButton").attachTap(function() {
				console.log("Tapped");
			});

			// testButton exists in two views and could be a sap.m.Button or a sap.ui.commons.Button.
			// The detection of deprecated button API depends requires TypeScript compliant probing (e.g. using "attachTap" in testButton).
			// In any case, the detection of UI5 Base Control API should still work as both inherit from it.
			const testButton = this.byId("testButton");
			testButton.getBlocked(); // This should be reported
			if ("attachTap" in testButton) {
				// When probing for the existence of the method, the type can be determined and the issue should be reported
				testButton.attachTap(function() {
					console.log("Tapped");
				});
			}

			// UI5 Element API should still be checked for unknown IDs
			this.byId("unknown").prop("foo", "bar");
			this.getView().byId("unknown").prop("foo", "bar");
		}
	});
});
