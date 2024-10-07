sap.ui.define(["sap/ui/core/Control", "sap/m/Button"], function(Control, Button) {
	const Example1 = Control.extend("sap.ui.demo.linter.controls.Example1", {
		metadata: {},
		renderer: "sap.ui.demo.linter.controls.Example1Renderer" // Declaration of renderer module as string (deprecated)
	});
	const Example2 = Control.extend("sap.ui.demo.linter.controls.Example2", {
		metadata: {},
		// Missing renderer declaration (deprecated)
	});
	const Example3 = Button.extend("sap.ui.demo.linter.controls.Example3", {
		metadata: {},
		// Missing renderer declaration (deprecated)
	});
});
