sap.ui.define(["sap/ui/core/Control", "./_7Renderer"], function (Control, Renderer) {
	var myControl = Control.extend("myControl", {
		metadata: {},
		renderer: Renderer,
	});
	
	return myControl;
});
