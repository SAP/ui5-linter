sap.ui.define(["sap/ui/core/Control"], function (Control) {
	const renderer = function (oRm, oMyControl) {
		oRm.openStart("div", oMyControl);
		oRm.class("mycssclass");
		oRm.openEnd();
		oRm.close("div");
	};
	
	const a = zzzz;
	const b = a;
	const c = b;
	
	var myControl = Control.extend("myControl", {
		metadata: {},
		renderer,
	});

	return myControl;
});
