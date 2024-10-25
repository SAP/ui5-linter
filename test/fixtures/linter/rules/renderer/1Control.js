sap.ui.define(["sap/ui/core/Control", "sap/ui/core/IconPool"], function (Control) {
	var myControl = Control.extend("mycomp.myControl", {
		metadata: {},
		renderer: {
			apiVersion: 1, // Deprecated
			render: function (oRm, oMyControl) {
				oRm.openStart("div", oMyControl);
				oRm.class("mycssclass");
				oRm.icon("sap-icon://appointment", null, { title: null }); // Not an issue- IconPool is declared as dependency
				oRm.openEnd();
				oRm.close("div");
			},
		},
	});
	
	return myControl;
});
