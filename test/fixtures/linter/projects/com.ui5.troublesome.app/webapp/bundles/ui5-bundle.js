//@ui5-bundle com/ui5/troublesome/app/bundles/ui5-bundle.js
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

// This file ensures that UI5 bundle files do not cause issues when they are linted.

// The referenced source map contains multiple sections, which refer to different
// sources. This should not lead to issues, especially when referenced sources are
// not part of the project, which can happen when thirdparty bundles are included
// in the project.

//# sourceMappingURL=ui5-bundle.js.map
