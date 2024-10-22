sap.ui.define(["../base/ManagedObject"], function(ManagedObject) {
	"use strict";
	var Element = ManagedObject.extend("sap.ui.core.Element", {
		metadata : {
			stereotype : "element",
			"abstract" : true,
			library : "sap.ui.core"
		},

		renderer : null // Element has no renderer
	});
	return Element;
});
