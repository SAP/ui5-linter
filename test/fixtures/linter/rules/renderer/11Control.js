sap.ui.define(["sap/ui/core/Control"], function (Control) {
	function render(oRm, oMyControl) {}
	const Renderer = {render};

	var myControl = Control.extend("mycomp.myControl", {
		metadata: {},
		renderer: Renderer.render,
	});

	return myControl;
});
