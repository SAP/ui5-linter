sap.ui.define(["sap/ui/core/Control"], function (Control) {
	return Control.extend("mycomp.myControl", {
		metadata: {},
		renderer: {
			apiVersion: "2", // Must be a number, not a string
			render: function(oRm, oControl) {
			}
		}
	});
});
