sap.ui.define(["sap/ui/core/Control", "sap/m/Button"], function(Control, Button) {
	const Example1 = Control.extend("sap.ui.demo.linter.controls.Example1", {
		metadata: {},
		// Declaration of renderer module as string (deprecated)
		renderer: "sap.ui.demo.linter.controls.Example1Renderer"
	});
	const Example2 = Control.extend("sap.ui.demo.linter.controls.Example2", {
		metadata: {},
		// Missing renderer declaration (deprecated)
	});
	const Example3 = Button.extend("sap.ui.demo.linter.controls.Example3", {
		metadata: {},
		// Missing renderer declaration (deprecated)
	});
	const Example4 = Control.extend("sap.ui.demo.linter.controls.Example4", {
		metadata: {},
		// TODO: Is this deprecated or not?
		renderer: function(oRm, oControl) {
		}
	});
});
