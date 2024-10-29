sap.ui.define(["sap/ui/core/Control"], function (Control) {
	var myControl = Control.extend("mycomp.myControl", {
		metadata: {},
		// Deprecated declaration. {apiVersion: 2} must be provided.
		renderer: (oRm, oMyControl) => {
			oRm.openStart("div", oMyControl);
			oRm.class("mycssclass");
			oRm.openEnd();
			oRm.close("div");
		},
	});
	
	myControl.prototype.myMethod = function (someParam) {
		// Should not be reported as someParam might not be a RenderManager.
		someParam.icon("sap-icon://appointment", null, { title: null });
	};

	return myControl;
});
