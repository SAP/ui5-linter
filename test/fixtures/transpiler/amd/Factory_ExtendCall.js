sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/UIComponent", "sap/ui/core/routing/History", "sap/m/Button"],
	function (Controller, UIComponent, History, Button) {
	"use strict";
	const someValue1 = "foo";
	const someValue2 = new Button();
	return Controller.extend("com.ui5.troublesome.app.controller.BaseController", {
		metadata: {
            interfaces: [
                library.IAsyncContentCreation
            ],
            manifest: "json"
		},
		prop1: 1,
		prop2: function(value) {
			console.log(value);
		},
		prop3: (value) => {
			console.log(value);
		},
		prop4: new Button(),
		prop5: History.getInstance(),
		prop6: someFunc("foo"),
		prop7: require("sap/m/Button"),
		prop8: someValue1,
		prop9: `${someValue1}`,
		prop10: someValue2,
		method1(value) {
			console.log(value);
		}
	});
});
