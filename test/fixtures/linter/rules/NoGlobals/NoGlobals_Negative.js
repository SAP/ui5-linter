sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/Button", "sap/ui/thirdparty/jquery"],
	function (Controller, sap, jQuery) {
	"use strict";

	return Controller.extend("my.BaseController", {

		createButton: function() {
			new sap(); // OK: Local variable "sap" is not illegal global variable access
			sap.init;
			jQuery.ajax(); // OK
			jQuery("#foo"); // OK
		}
	});
});
