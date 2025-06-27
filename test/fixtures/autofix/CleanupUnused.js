sap.ui.define(["sap/ui/core/Core", "sap/ui/core/Configuration"], function(Core, Configuration) {
	Core.getConfiguration().setRTL(false); // Requires two iterations

	Configuration.setRTL(false);
	Configuration.getLocale();
	// After migration, dependencies "Core" and "Configuration" have become obsolete
});