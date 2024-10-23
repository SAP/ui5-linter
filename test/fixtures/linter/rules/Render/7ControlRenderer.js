// This file would be skipped from direct testing.
// It would be tested via its Control
sap.ui.define([], function () {
	var myControlRenderer = {
		apiVersion: 2,
	};
	myControlRenderer.render = function (oRm, oMyControl) {
		oRm.openStart("div", oMyControl);
		oRm.icon("sap-icon://appointment", null, { title: null });
		oRm.openEnd();
		oRm.close("div");
	};
	return myControlRenderer;
});
