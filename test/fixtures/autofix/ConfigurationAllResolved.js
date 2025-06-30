sap.ui.define(["sap/ui/core/Core", "sap/ui/core/Configuration"], function(Core, Configuration) {
	Core.getConfiguration().setRTL(false); // Requires two iterations

	Configuration.setRTL(false);
	Configuration.getLocale();
});