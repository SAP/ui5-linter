sap.ui.define(["sap/ui/core/Core",], function(Core) {
	Core.applyTheme("themeName");
	Core.applyTheme("customTheme", "find/my/theme/here"); // Should not be autofixed if there is a 2nd argument
	Core.applyTheme("customTheme", undefined); // Can be migrated when the 2nd argument is undefined

	Core.attachInit(function() {console.log();});

	Core.attachInitEvent(function() {console.log();});

	Core.attachIntervalTimer(function() {console.log();});
	Core.attachIntervalTimer(function() {}, {}); // Should not be autofixed if there is a 2nd argument

	Core.byId("id");
});