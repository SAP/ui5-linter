// Component which does not inherit from UIComponent:
// Missing reference to manifest.json should be reported
sap.ui.define(["sap/ui/core/Component"], function (Component) {
	"use strict";

	return Component.extend("mycomp.Component", {
		"metadata": {},
	});
});
