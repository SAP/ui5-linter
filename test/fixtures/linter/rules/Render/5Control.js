sap.ui.define(["sap/ui/core/Control", "./5ControlRenderer"], function (Control, Renderer) {
	var myControl = Control.extend("mycomp.myControl", {
		metadata: {},
		renderer: Renderer,
	});
	
	return myControl;
});
