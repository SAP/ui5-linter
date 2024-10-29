sap.ui.define([], function () {
	var myControlRenderer = {
		// apiVersion: 2, // apiVersion property must be present and to have value 2
	};
	myControlRenderer.render = function (oRm, oMyControl) {
		oRm.openStart("div", oMyControl);
		renderIcon(oRm);
		oRm.openEnd();
		oRm.close("div");
	};

	function renderIcon(oRm) {
		// The line below is detected via normal rules, not through the context of the render method
		var oProperties1 = jQuery.sap.properties(); // jQuery.sap.properties is deprecated

		// Reported- IconPool is NOT declared as dependency
		oRm.icon("sap-icon://appointment", null, { title: null });
	}
	return myControlRenderer;
});
