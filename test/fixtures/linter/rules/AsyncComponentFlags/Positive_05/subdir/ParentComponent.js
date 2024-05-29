sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
	"use strict";

	return UIComponent.extend("mycomp.subdir.ParentComponent", {
		metadata: {
			manifest: {
				"sap.ui5": {
					rootView: {
						viewName: "mycomp.view.App",
						type: "XML",
						id: "app",
						async: true
					},
				}
			}
		},
	});
});
