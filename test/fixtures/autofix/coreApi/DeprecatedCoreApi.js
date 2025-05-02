sap.ui.define(["sap/ui/core/Core",], function(Core) {
	Core.applyTheme("themeName");
	Core.applyTheme("customTheme", "find/my/theme/here"); // Should not be autofixed if there is a 2nd argument

	Core.attachInit(function() {console.log();});

	Core.attachInitEvent(function() {console.log();});

	Core.attachIntervalTimer(function() {console.log();});
	Core.attachIntervalTimer(function() {}, {}); // Should not be autofixed if there is a 2nd argument

	Core.attachLocalizationChanged(function() {console.log();});
	Core.attachLocalizationChanged(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	Core.attachThemeChanged(function() {console.log();});
	Core.attachThemeChanged(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	Core.byFieldGroupId("id");
	Core.byFieldGroupId(["id", "id2"]);

	Core.byId("id");

	Core.createComponent("componentName", "find/my/comp/here", "id", {"settingsKey": "..."}); // First argument is a string
	Core.createComponent({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}, component: {}}); // First argument is an object

	Core.detachIntervalTimer(function() {console.log();});
	Core.detachIntervalTimer(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	Core.detachLocalizationChanged(function() {console.log();});
	Core.detachLocalizationChanged(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	Core.detachThemeChanged(function() {console.log();});
	Core.detachThemeChanged(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	Core.getComponent("componentId");

	Core.getControl("controlId");

	Core.getCurrentFocusedControlId();

	Core.getElementById("elementId");

	Core.getEventBus();

	Core.getLibraryResourceBundle("sap.ui.core", "en_US", "true");

	Core.getStaticAreaRef();

	Core.getTemplate("templateId");

	Core.initLibrary({
		name: "sap.ui.core",
		version: "1.0.0",
		dependencies: ["sap.ui.core"],
		noLibraryCSS: true,
		types: ["type1", "type2"],
		interfaces: ["interface1", "interface2"],
		elements: ["element1", "element2"],
		controls: ["control1", "control2"],
		extensions: {
			someExtension: {}
		}
	});

	Core.isMobile();

	Core.isStaticAreaRef(oDomRef);

	Core.loadLibrary("sap.ui.core", "find/my/lib/here");

	Core.notifyContentDensityChanged();

});
