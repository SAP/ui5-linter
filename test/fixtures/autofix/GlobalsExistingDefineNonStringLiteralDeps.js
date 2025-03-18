sap.ui.define([
	someModuleName
], function(someModule) {

	new sap.m.Button();

	sap.ui.require([someOtherModuleName], function(someOtherModule) {
		new sap.m.Input();
	});

});
