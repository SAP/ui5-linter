sap.ui.define(["sap/ui/core/Control", "sap/m/Button"], function(Control, Button) {
	const Example1 = Control.extend("sap.ui.demo.linter.controls.Example1", {
		metadata: {},
		// Declaration of renderer module as string (deprecated)
		renderer: "sap.ui.demo.linter.controls.Example1Renderer"
	});
	const Example2 = Control.extend("sap.ui.demo.linter.controls.Example2", {
		metadata: {},
		// Declaration of renderer module as template literal (deprecated)
		renderer: `sap.ui.demo.linter.controls.Example2Renderer`
	});
	const Example3 = Control.extend("sap.ui.demo.linter.controls.Example3", {
		metadata: {},
		// Declaration of renderer module as template literal with substitution (deprecated)
		renderer: `sap.ui.demo.linter.controls.Example${1+2}Renderer`
	});
	const Example4 = Control.extend("sap.ui.demo.linter.controls.Example4", {
		metadata: {},
		// Missing renderer declaration (deprecated)
	});
	const Example5 = Button.extend("sap.ui.demo.linter.controls.Example5", {
		metadata: {},
		// Missing renderer declaration (deprecated)
	});
});
