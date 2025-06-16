sap.ui.define(["sap/ui/core/Core", "sap/ui/core/Configuration"], function(Core, Configuration) {
	Core.getConfiguration().setRTL(false); // Requires two iterations
	Core.getConfiguration().setRTL(false).setLanguage("en");

	Configuration.setRTL(false);
	// Currently not fixable:
	// setRTL is not chainable and setLanguage can't be applied because
	// its expression contains a non-side-effect-free call expression
	Configuration.setRTL(false).setLanguage("en");

	Configuration.getLocale();
});