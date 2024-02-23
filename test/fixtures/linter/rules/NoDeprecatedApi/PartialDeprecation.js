sap.ui.define([
	"sap/ui/core/theming/Parameters",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v4/ODataModel",
	"sap/ui/model/odata/v2/ODataModel"
], function(Parameters, JSONModel, ODataModelV4, ODataModelV2) {

	Parameters.get(); // TODO detect: (deprecated since 1.92) If no parameter is given
	Parameters.get("sapUiParam1"); // TODO detect: (deprecated since 1.94) If a string is given as first parameter
	Parameters.get(["sapUiParam1", "sapUiParam2"]); // TODO detect: (deprecated since 1.94) If an array is given as first parameter

	var jsonModel = new JSONModel();
	jsonModel.loadData("/api/users", undefined, false); // TODO detect: Parameter bAsync is deprecated as of Version 1.107 (default=true)

	var v4Model = new ODataModelV4({
		synchronizationMode: "None" // TODO detect: Parameter "synchronizationMode" is deprecated since 1.110
	});

	var v2Model = new ODataModelV2();
	v2Model.createEntry("somePath", {
		batchGroupId: "id-123", // TODO detect: Deprecated - use groupId instead
		properties: ["property1", "property2"] // TODO detect: Passing a list of property names is deprecated since 1.120; pass the initial values as an object instead
	});

});
