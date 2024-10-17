// Minimal example of singleton pattern used in sap/ui/core/Core.js of UI5 1.x
sap.ui.define([
	"sap/ui/base/Object",
], function(BaseObject) {
	"use strict";

	if (window.mySingleton) {
		return window.mySingleton;
	}

	var MySingletonClass = BaseObject.extend("test.MySingletonClass", {});

	window.mySingleton = new MySingletonClass();

	return window.mySingleton;
});
