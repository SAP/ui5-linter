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
		oRm.icon("sap-icon://appointment", null, { title: null });
	}
	return myControlRenderer;
});
