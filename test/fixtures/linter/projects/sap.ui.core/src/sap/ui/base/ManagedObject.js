sap.ui.define(["./EventProvider"], function(EventProvider) {
	"use strict";
	var ManagedObject = EventProvider.extend("sap.ui.base.ManagedObject", {
		metadata : {
			"abstract" : true,
			library : "sap.ui.core", // UI Library that contains this class
		},
	});
	return ManagedObject;
});
