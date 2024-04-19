sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
	"use strict";

	return UIComponent.extend("com.ui5.troublesome.app.Component", {
		interfaces: ["sap.ui.core.IAsyncContentCreation"],
		metadata: {
			manifest: {
				_version: "1.12.0",

				"sap.app": {
					id: "com.ui5.troublesome.app",
					type: "application",
					i18n: "i18n/i18n.properties",
					title: "{{appTitle}}",
					description: "{{appDescription}}",
					applicationVersion: {
						version: "1.0.0",
					},
				},

				"sap.ui5": {
					rootView: {
						viewName: "com.ui5.troublesome.app.view.App",
						type: "XML",
						async: true,
						id: "app",
					},

					routing: {
						config: {
							routerClass: "sap.m.routing.Router",
							viewType: "XML",
							viewPath: "com.ui5.troublesome.app.view",
							controlId: "app",
							controlAggregation: "pages",
							async: true,
						},
						routes: [
							{
								pattern: "",
								name: "main",
								target: "main",
							},
						],
						targets: {
							main: {
								viewId: "main",
								viewName: "Main",
							},
						},
					},
				},
			},
		},
	});
});
