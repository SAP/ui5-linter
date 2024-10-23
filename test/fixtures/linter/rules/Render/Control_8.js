sap.ui.define(["sap/ui/core/Control", "./_8Renderer"], function (Control, Renderer) {
	var myControl = Control.extend("myControl", {
		metadata: {},
		renderer: Renderer,
	});
	
	return myControl;
});
