sap.ui.define(["sap/ui/core/Core", "sap/ui/core/Configuration"], function(Core, Configuration) {
	Core.getConfiguration().setRTL(false).setLanguage("en");

	// Currently not fixable:
	// setRTL is not chainable and setLanguage can't be applied because
	// its expression contains a non-side-effect-free call expression
	Configuration.setRTL(false).setLanguage("en");
});