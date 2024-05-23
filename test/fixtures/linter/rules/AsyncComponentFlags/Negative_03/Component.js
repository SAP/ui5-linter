sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
	"use strict";

	return UIComponent.extend("mycomp.Component", {
		metadata: {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
			manifest: {
				_version: "1.12.0",

				"sap.app": {
					id: "mycomp",
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
						viewName: "mycomp.view.App",
						type: "XML",
						id: "app",
					},

					routing: {
						config: {
							routerClass: "sap.m.routing.Router",
							viewType: "XML",
							viewPath: "mycomp.view",
							controlId: "app",
							controlAggregation: "pages",
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
