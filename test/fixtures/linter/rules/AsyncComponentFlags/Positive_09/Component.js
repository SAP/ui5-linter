// IAsyncContentCreation interface is implemented via sap.ui.core.library property
// which is a bad practice (see https://github.com/SAP/openui5/issues/3895) and therefore ignored
sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/core/library"], function (UIComponent, coreLib) {
	"use strict";

	return UIComponent.extend("mycomp.Component", {
		"metadata": {
			"interfaces": [coreLib.IAsyncContentCreation],
			"manifest": "json",
		},
	});
});
