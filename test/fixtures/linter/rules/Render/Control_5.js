sap.ui.define(["sap/ui/core/Control", "./_5Renderer"], function (Control, Renderer) {
	var myControl = Control.extend("myControl", {
		metadata: {},
		renderer: Renderer,
	});
	
	return myControl;
});
