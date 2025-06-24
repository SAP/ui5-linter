sap.ui.define([
	"sap/ui/model/odata/v4/ODataModel",
], function(ODataModel) {
	var model = new ODataModel({
		serviceUrl: "/odata/v4/service",
		synchronizationMode: "None" // Parameter "synchronizationMode" is deprecated since 1.110
	});
	var model = new ODataModel({
		serviceUrl: "/odata/v4/service",
		/* Parameter "synchronizationMode" is deprecated since 1.110 */ "synchronizationMode": true
	});
});