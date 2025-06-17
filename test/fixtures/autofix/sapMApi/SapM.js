sap.ui.define(["sap/m/Button"], function(Button) {
	const btn = new Button({
		tap: function() {} // Deprecated class property tap should be replaced
	});
	btn.attachTap(function() {}); // Deprecated method attachTap should be replaced
	btn.detachTap(function() {});
});
