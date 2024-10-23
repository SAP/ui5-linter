sap.ui.define(["sap/ui/core/Control"], function (Control) {
	var myControl = Control.extend("myControl", {
		metadata: {},
		renderer: (oRm, oMyControl) => {
			oRm.openStart("div", oMyControl);
			oRm.class("mycssclass");
			oRm.openEnd();
			oRm.close("div");
		},
	});

	return myControl;
});
