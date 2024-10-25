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

	return myControl;
});
