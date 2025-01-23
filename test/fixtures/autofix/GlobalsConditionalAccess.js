// Usage of a global variable only after probing for its existence should be replaced with an eager dependency
sap.ui.define([], function() {

	var fnGetService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
	if (fnGetService) {
		const oCrossAppNavigator = fnGetService("CrossApplicationNavigation");

		// A later non-conditional usage should still not be replaced
		const oCrossAppNavigator2 = sap.ushell.Container.getService("CrossApplicationNavigation");
	}

	if (sap.ui.support) { // Only if support assistant is loaded
		console.log("Support assistant is loaded");
	}

	// Should not be replaced, as this is a lazy dependency
	if (sap.m.CheckBox) {
		console.log("CheckBox is loaded");
		const oCheckBox = new sap.m.CheckBox();
	}

	// Should not be replaced, as this is a lazy dependency
	const element = sap?.ui?.core?.Element?.getElementById?.("foo");

	// Checking for existence of a property of the module export should not prevent the replacement, as this is not a lazy dependency
	if (sap.m.Button.prototype.someMethod) {
		console.log("Button prototype has someMethod");
	}

	// // Should be replaced, as there is no lazy dependency to Button in this module
	const oButton = new sap.m.Button();

});
