sap.ui.define(["./Element"], function(Element) {
	"use strict";
	var Control = Element.extend("sap.ui.core.Control", {
		metadata : {
			stereotype : "control",
			"abstract" : true,
			library: "sap.ui.core",
		},

		renderer : null // Control has no renderer
	});
	return Control;
});
