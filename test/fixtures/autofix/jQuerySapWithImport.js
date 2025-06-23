sap.ui.define([], function () {
	// https://github.com/UI5/linter/issues/586
	var myFancyControl = jQuery(".fancyContainer");

	// https://github.com/UI5/linter/issues/578
	var myFancyControl = jQuery(".fancyContainer").control();
	var myFancyControl2 = jQuery(".fancyContainer").control(0);
	var myFancyControl2 = jQuery(".fancyContainer").control(0, true);
	// TODO: This does not work, yet: jQuery("#button3").control(0).setText("Hello");
});
