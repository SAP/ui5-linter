import test from "ava";
import ManifestLinter from "../../../../src/linter/manifestJson/ManifestLinter.js";
import LinterContext from "../../../../src/linter/LinterContext.js";

test("Valid manifest", async (t) => {
	const context = new LinterContext({rootDir: "ui5.test"});
	const manifestLinter = new ManifestLinter("/manifest.json", JSON.stringify({
		"_version": "1.58.0",
		"sap.app": {
			id: "ui5.test",
			title: "{{appTitle}}",
			description: "{{appDescription}}",
			type: "application",
			applicationVersion: {
				version: "1.0.0",
			},
		},
		"sap.ui5": {
			dependencies: {
				minUI5Version: "1.120.0",
				libs: {
					"sap.ui.core": {},
				},
			},
			rootView: {
				viewName: "ui5.test.view.App",
				type: "XML",
				id: "app",
			},
			routing: {
				config: {
					routerClass: "sap.m.routing.Router",
					type: "View",
					viewType: "XML",
					path: "ui5.test.view",
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
						id: "main",
						name: "Main",
					},
				},
			},
		},
	}), context);

	await manifestLinter.lint();

	t.snapshot(context.generateLintResults());
});

test("sap.ui5/routing: Missing 'type'", async (t) => {
	const context = new LinterContext({rootDir: "ui5.test"});
	const manifestLinter = new ManifestLinter("/manifest.json", JSON.stringify({
		"_version": "1.58.0",
		"sap.app": {
			id: "ui5.test",
			type: "application",
		},
		"sap.ui5": {
			rootView: {
				viewName: "ui5.test.view.App",
				type: "XML",
				id: "app",
			},
			routing: {
				config: {
					viewType: "XML",
					path: "ui5.test.view",
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
					// Invalid, as no type is defined
					main: {
						id: "main",
						name: "Main",
					},
					// Valid, as type is defined specifically for this target
					details: {
						id: "main",
						name: "Main",
						type: "View",
					},
				},
			},
		},
	}), context);

	await manifestLinter.lint();

	t.snapshot(context.generateLintResults());
});

test("sap.ui5/routing: Legacy target properties", async (t) => {
	const context = new LinterContext({rootDir: "ui5.test"});
	const manifestLinter = new ManifestLinter("/manifest.json", JSON.stringify({
		"_version": "1.58.0",
		"sap.app": {
			id: "ui5.test",
			type: "application",
		},
		"sap.ui5": {
			rootView: {
				viewName: "ui5.test.view.App",
				type: "XML",
				id: "app",
			},
			routing: {
				config: {
					viewType: "XML",
					viewPath: "ui5.test.view",
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
						viewType: "XML",
						viewLevel: 1,
					},
					details: {
						viewId: "details",
						viewName: "Details",
						viewPath: "ui5.test.view.details",
					},
				},
			},
		},
	}, null, 2), context);

	await manifestLinter.lint();

	t.snapshot(context.generateLintResults());
});
