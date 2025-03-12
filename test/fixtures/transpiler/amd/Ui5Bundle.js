//@ui5-bundle com/ui5/troublesome/app/bundles/ui5-bundle-without-sourcemap.js
jQuery.sap.registerPreloadedModules({
	"version": "2.0",
	"modules": {
		"com/ui5/troublesome/app/Component.js": function () {
			sap.ui.define(["sap/ui/Device"], function () {
				return sap.ui.core.UIComponent.extend("com.ui5.troublesome.app.Component", {
					metadata: {
						manifest: "json"
					}
				});
			});
		}
	}
});

// This file should be excluded from linting as it is a UI5 bundle file.
// It should also not be transformed  by the amdTranspiler.
