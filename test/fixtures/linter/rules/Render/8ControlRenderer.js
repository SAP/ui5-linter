// This file would be skipped from direct testing.
// It would be tested via its Control
sap.ui.define([], function () {
	var myControlRenderer = {
		apiVersion: 2,
	};
	myControlRenderer.render = function (oRm, oMyControl) {
		oRm.openStart("div", oMyControl);
		renderIcon(oRm);
		oRm.openEnd();
		oRm.close("div");
	};

	function renderIcon(oRm) {
		// TODO: Should be Reported- IconPool is NOT declared as dependency
		// Currently, not supported as we are not able to identify at the moment
		// that the oRm is actually a RenderManager.
		// This test case is rather an easy one, but in sap.m library for example,
		// there are inheritance chains where RenderManager is passed down/up the chain
		// and cannot be easily determined. Such scenario are controls inheriting from sap.m.InputBase
		oRm.icon("sap-icon://appointment", null, { title: null });
	}
	return myControlRenderer;
});
