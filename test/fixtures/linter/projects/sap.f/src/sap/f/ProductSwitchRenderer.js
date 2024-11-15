sap.ui.define(function () {
	"use strict";
	return {
		apiVersion: 1, // Reported: apiVersion property must be present and to have value 2
		render: function (oRm, oControl) {
			// Reported: IconPool is NOT declared as dependency
			oRm.icon("sap-icon://appointment", null, { title: null });
		}
	};
});
