sap.ui.define([], function () {
	var myControlRenderer = {
		apiVersion: 2,
	};
	myControlRenderer.render = function (oRm, oMyControl) {
		oRm.openStart("div", oMyControl);
		// Reported- IconPool is NOT declared as dependency
		oRm.icon("sap-icon://appointment", null, { title: null });
		oRm.openEnd();
		oRm.close("div");
	};
	return myControlRenderer;
});
