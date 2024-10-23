sap.ui.define(["sap/ui/core/Control"], function (Control) {
	const renderer = function (oRm, oMyControl) {
		oRm.openStart("div", oMyControl);
		oRm.class("mycssclass");
		oRm.openEnd();
		oRm.close("div");
	};
	
	var myControl = Control.extend("mycomp.myControl", {
		metadata: {},
		renderer: renderer,
	});

	return myControl;
});
