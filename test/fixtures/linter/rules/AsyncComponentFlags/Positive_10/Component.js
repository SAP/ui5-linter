// Component which does not inherit from UIComponent:
// - Missing reference to manifest.json should be reported
// - Usage of deprecated type in properties should be reported
sap.ui.define(["sap/ui/core/Component"], function (Component) {
	"use strict";

	return Component.extend("mycomp.Component", {
		metadata: {
			"properties": {
				// Usage of deprecated type
				propertyWithDeprecatedType: {
					type: "sap.m.DateTimeInputType"
				},
			}
		},
	});
});
