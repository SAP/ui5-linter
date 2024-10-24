sap.ui.define(["sap/ui/core/Control"], function (Control) {
	var myControl = Control.extend("mycomp.myControl", {
		metadata: {},
		renderer: {
			apiVersion: 2,
			render: function (oRm, oMyControl) {
				oRm.openStart("div", oMyControl);
				// Reported- IconPool is NOT declared as dependency
				oRm.icon("sap-icon://appointment", null, { title: null });
				oRm.openEnd();
				oRm.close("div");
			},
		},
	});
	return myControl;
});
