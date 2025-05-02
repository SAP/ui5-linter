sap.ui.define([], function() {
	sap.ui.getCore().applyTheme("themeName");
	sap.ui.getCore().applyTheme("customTheme", "find/my/theme/here"); // Should not be autofixed if there is a 2nd argument

	sap.ui.getCore().attachInit(function() {console.log();});

	sap.ui.getCore().attachInitEvent(function() {console.log();});

	sap.ui.getCore().attachIntervalTimer(function() {console.log();});
	sap.ui.getCore().attachIntervalTimer(function() {}, {}); // Should not be autofixed if there is a 2nd argument

	sap.ui.getCore().attachLocalizationChanged(function() {console.log();});
	sap.ui.getCore().attachLocalizationChanged(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	sap.ui.getCore().attachThemeChanged(function() {console.log();});
	sap.ui.getCore().attachThemeChanged(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	sap.ui.getCore().byFieldGroupId("id");
	sap.ui.getCore().byFieldGroupId(["id", "id2"]);

	sap.ui.getCore().byId("id");

	sap.ui.getCore().createComponent("componentName", "find/my/comp/here", "id", {"settingsKey": "..."}); // First argument is a string
	sap.ui.getCore().createComponent({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}, component: {}}); // First argument is an object

	sap.ui.getCore().detachIntervalTimer(function() {console.log();});
	sap.ui.getCore().detachIntervalTimer(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	sap.ui.getCore().detachLocalizationChanged(function() {console.log();});
	sap.ui.getCore().detachLocalizationChanged(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	sap.ui.getCore().detachThemeChanged(function() {console.log();});
	sap.ui.getCore().detachThemeChanged(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	sap.ui.getCore().getComponent("componentId");

	sap.ui.getCore().getControl("controlId");

	sap.ui.getCore().getCurrentFocusedControlId();

	sap.ui.getCore().getElementById("elementId");

	sap.ui.getCore().getEventBus();

	sap.ui.getCore().getLibraryResourceBundle("sap.ui.core", "en_US", "true");

	sap.ui.getCore().getStaticAreaRef();

	sap.ui.getCore().getTemplate("templateId");

	sap.ui.getCore().initLibrary({
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

	sap.ui.getCore().isMobile();

	sap.ui.getCore().isStaticAreaRef(oDomRef);

	sap.ui.getCore().loadLibrary("sap.ui.core", "find/my/lib/here");

	sap.ui.getCore().notifyContentDensityChanged();
});

