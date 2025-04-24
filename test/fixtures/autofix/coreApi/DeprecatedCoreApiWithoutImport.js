sap.ui.define([], function() {
	sap.ui.getCore().applyTheme("sap_horizon");
	sap.ui.getCore().applyTheme("custom_theme", "https://example.com/"); // Should not be autofixed due to the 2nd parameter
	sap.ui.getCore().attachInit(function() {});
	sap.ui.getCore().attachInitEvent(function() {});
	sap.ui.getCore().attachIntervalTimer(function() {});
	sap.ui.getCore().attachIntervalTimer(function() {}, {}); // Should not be autofixed if the 2nd parameter != undefined
	//TODO: ...
});

