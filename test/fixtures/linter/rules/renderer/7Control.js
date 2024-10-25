sap.ui.define(["sap/ui/core/Control", "./7ControlRenderer"], function (Control, Renderer) {
	var myControl = Control.extend("mycomp.myControl", {
		metadata: {},
		renderer: Renderer,
	});
	
	return myControl;
});
