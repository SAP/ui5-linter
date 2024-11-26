sap.ui.define(["./Element"], function(Element) {
	"use strict";
	var Control = Element.extend("sap.ui.core.Control", {
		metadata : {
			stereotype : "control",
			"abstract" : true,
			library: "sap.ui.core",
		},

		// Should not be detected as declaration / override of a deprecated method
		rerender: function() {},

		renderer : null // Control has no renderer
	});
	return Control;
});
