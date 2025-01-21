sap.ui.define([
	"sap/ui/core/theming/Parameters",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v4/ODataModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/core/Component",
	"sap/ui/core/routing/Router",
	"sap/ui/util/Mobile",
	"sap/ui/core/mvc/View",
	"sap/ui/core/mvc/ViewType",
	"sap/ui/core/Fragment",
], function(Parameters, JSONModel, ODataModelV4, ODataModelV2, Component, Router, Mobile, View, ViewType, Fragment) {

	Parameters.get(); // (deprecated since 1.92) If no parameter is given
	Parameters.get("sapUiParam1"); // (deprecated since 1.94) If a string is given as first parameter
	Parameters.get(["sapUiParam1", "sapUiParam2"]); // (deprecated since 1.94) If an array is given as first parameter

	// Negative test: Passing an object is the only non-deprecated usage
	Parameters.get({
		name: ["sapUiParam1", "sapUiParam2", "sapUiParam3"],
		callback: function(mParams) {}
	 });

	var getParam = Parameters.get;
	getParam(); // (deprecated since 1.92) If no parameter is given

	var jsonModel = new JSONModel();
	jsonModel.loadData("/api/users", undefined); // No deprecation
	jsonModel.loadData("/api/users", undefined, false); // Parameter bAsync is deprecated as of Version 1.107 (default=true)
	jsonModel.loadData("/api/users", undefined, true, "GET", false, false); // Parameter bCache is deprecated as of Version 1.107 (default=true)

	var v4Model = new ODataModelV4({
		synchronizationMode: "None" // Parameter "synchronizationMode" is deprecated since 1.110
	});
	var v4Model = new ODataModelV4({
		"synchronizationMode": true // Parameter "synchronizationMode" is deprecated since 1.110
	});
	var v4Model = new ODataModelV4({
		serviceUrl: "my-service" // Negative test: Deprecated parameter is omitted
	});

	var v2Model = new ODataModelV2();
	v2Model.createEntry("somePath", {
		batchGroupId: "id-123", // Deprecated - use groupId instead
		properties: ["property1", "property2"] // Passing a list of property names is deprecated since 1.120; pass the initial values as an object instead
	});
	v2Model.createEntry("somePath"); // Negative test: No deprecated parameters

	Component.create({
		name: "my.comp",
		url: "find/my/comp/here",
		id: "myCompId1"
	}).then(function(oComponent) {
		oComponent.createComponent({
			usage: "myUsage",
			id: "myId",
			async: false, // Deprecated: "async" must be true or omitted
		});
		// Negative test: No async flag will default to true
		oComponent.createComponent({
			usage: "myUsage",
			id: "myId",
		});
		// Negative test: async true is correct
		oComponent.createComponent({
			usage: "myUsage",
			id: "myId",
			async: true,
		});
	});

	new Router([], {}); // Deprecated: "oConfig.async" must set be true
	new Router([], {async: false}); // Deprecated: "oConfig.async" must set be true
	new Router([], {async: true}); // Negative test: async true is correct

	Mobile.init({
		homeIcon: "icon.png", // Deprecated
		homeIconPrecomposed: true, // Deprecated
	});
	Mobile.init({}); // Negative test: No deprecated parameters

	View.create({
		type: "JS", // Deprecated type
		viewName: "myapp.view.Home"
	});
	View.create({
		type: ViewType.JS, // Deprecated type
		viewName: "myapp.view.Home"
	});

	View.create({
		type: "JSON", // Deprecated type
		viewName: "myapp.view.Home"
	});
	View.create({
		type: ViewType.JSON, // Deprecated type
		viewName: "myapp.view.Home"
	});

	View.create({
		type: "HTML", // Deprecated type
		viewName: "myapp.view.Home"
	});
	View.create({
		type: ViewType.HTML, // Deprecated type
		viewName: "myapp.view.Home"
	});

	View.create({
		type: "Template", // Deprecated type
		viewName: "myapp.view.Home"
	});
	View.create({
		type: ViewType.Template, // Deprecated type
		viewName: "myapp.view.Home"
	});

	// Negative tests: No deprecated types
	View.create({
		viewName: "module:myapp.view.Home"
	});
	View.create({
		type: "XML",
		viewName: "myapp.view.Home"
	});
	View.create({
		type: ViewType.XML,
		viewName: "myapp.view.Home"
	});


	Fragment.load({
		type: "HTML", // Deprecated type HTML
		name: "myapp.fragment.Details"
	});

	// Negative test: Default type is XML
	Fragment.load({
		name: "myapp.fragment.Details"
	});
	// Negative test: XML
	Fragment.load({
		type: "XML",
		name: "myapp.fragment.Details"
	});
	// Negative test: JS
	Fragment.load({
		type: "JS",
		name: "myapp.fragment.Details"
	});

});
