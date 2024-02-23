sap.ui.define(["sap/ui/core/mvc/Controller"],
	function (Controller) {
	"use strict";

	return Controller.extend("my.BaseController", {

		doThings: function() {
			new sap.m.Button(); // ERROR: Global variable "sap"
			cust.lib.helperFunction(); // OK: Global third-party variable

			const mobile = sap.m; // ERROR: Global variable "sap"
			const label = new mobile.Label(); // OK: Local variable

			sap.ui.requireSync(); // ERROR: Global variable "sap"
			window["sap"].ui.requireSync(); // ERROR: Global variable "sap"
			window.sap.ui.requireSync(); // ERROR: Global variable "sap"
			globalThis.sap.ui.requireSync(); // ERROR but not detected: Global variable "sap"
			self.sap.ui.requireSync(); // ERROR: Global variable "sap"
			const that = window;
			that.sap.ui.requireSync(); // ERROR: Global variable "sap"
			sap.ui.require(); // OK: Special case sap.ui.require / sap.ui.define
			sap.ui.define(); // OK: Special case sap.ui.require / sap.ui.define
			sap.ui.require.toUrl(); // OK: Special case sap.ui.require / sap.ui.define
			sap.ui.loader.config(); // OK: Special case sap.ui.loader
			window["sap"].ui.require(); // OK: Special case sap.ui.require

			jQuery.ajax(); // ERROR: Global third-party variable "jQuery"
			jQuery("#foo"); // ERROR: Global third-party variable "jQuery"
			jQuery.sap.require(); // ERROR: Global variable "jQuery.sap"

			QUnit.test(); // OK: Global third-party variable "QUnit"
			sinon.stub(); // OK: Global third-party variable "sinon"
		}
	});
});
