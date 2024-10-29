sap.ui.define(["sap/ui/core/Control", "./8ControlRenderer"], function (Control, Renderer) {
	var myControl = Control.extend("mycomp.myControl", {
		metadata: {},
		renderer: Renderer,
	});
	
	myControl.prototype.myMethod = function (someParam) {
		// Should not be reported as someParam might not be a RenderManager.
		someParam.icon("sap-icon://appointment", null, { title: null });
	};
	
	return myControl;
});
