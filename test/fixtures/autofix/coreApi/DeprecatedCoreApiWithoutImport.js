sap.ui.define([], function() {
	const globalCore = sap.ui.getCore();
	sap.ui.getCore().applyTheme("themeName");
	sap.ui.getCore().applyTheme("customTheme", "find/my/theme/here"); // Should not be autofixed if there is a 2nd argument
	sap.ui.getCore().applyTheme("customTheme", undefined); // Can be autofixed when the 2nd argument is undefined

	globalCore.attachInit(function() {console.log();});
	sap.ui.getCore().attachInit(function() {console.log();});

	globalCore.attachInitEvent(function() {console.log();});
	sap.ui.getCore().attachInitEvent(function() {console.log();});

	sap.ui.getCore().attachIntervalTimer(function() {console.log();});
	sap.ui.getCore().attachIntervalTimer(function() {}, {}); // Should not be autofixed if there is a 2nd argument

	sap.ui.getCore().byFieldGroupId("id");
	sap.ui.getCore().byFieldGroupId(["id", "id2"]);

	sap.ui.getCore().byId("id");

	sap.ui.getCore().createComponent({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}, component: {}, async: true}); // First argument must be an object containing async: true for autofix to be applied
	sap.ui.getCore().createComponent({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}, component: {}}); // Not autofixable
	sap.ui.getCore().createComponent("componentName", "find/my/comp/here", "id", {"settingsKey": "..."}); // First argument is a string (not autofixable)

	sap.ui.getCore().detachIntervalTimer(function() {console.log();});
	sap.ui.getCore().detachIntervalTimer(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	sap.ui.getCore().getComponent("componentId");

	globalCore.getControl("controlId");
	sap.ui.getCore().getControl("controlId");

	sap.ui.getCore().getCurrentFocusedControlId();

	globalCore.getElementById("elementId");
	sap.ui.getCore().getElementById("elementId");

	sap.ui.getCore().getEventBus();

	sap.ui.getCore().getLibraryResourceBundle("sap.ui.core", "en_US");
	sap.ui.getCore().getLibraryResourceBundle(); // Should fall back to "sap.ui.core"
	sap.ui.getCore().getLibraryResourceBundle("unknown.lib"); // Do not migrate unknown libraries
	sap.ui.getCore().getLibraryResourceBundle(true); // bAsync is true (not autofixable)
	sap.ui.getCore().getLibraryResourceBundle("sap.ui.core", true); // bAsync is true (not autofixable)
	sap.ui.getCore().getLibraryResourceBundle("sap.ui.core", "en_US", true); // bAsync is true (not autofixable)

	sap.ui.getCore().getStaticAreaRef();

	sap.ui.getCore().initLibrary({
		version: "1.0.0",
		name: "sap.ui.core",
		dependencies: ["sap.ui.core"],
		types: ["type1", "type2"],
		interfaces: ["interface1", "interface2"],
		controls: ["control1", "control2"],
		elements: ["element1", "element2"],
		noLibraryCSS: true,
		extensions: {
			someExtension: {}
		}
	});

	globalCore.isMobile();
	sap.ui.getCore().isMobile();

	globalCore.isStaticAreaRef(oDomRef);
	sap.ui.getCore().isStaticAreaRef(oDomRef);

	sap.ui.getCore().loadLibrary("sap.ui.core", true);
	sap.ui.getCore().loadLibrary("sap.ui.core", {async: true, url: "find/my/lib/here"});
	sap.ui.getCore().loadLibrary("sap.ui.core", {async: false, url: "find/my/lib/here"}); // async: false (not autofixable)
	sap.ui.getCore().loadLibrary("sap.ui.core", {url: "find/my/lib/here"}); // async omitted (not autofixable)
	sap.ui.getCore().loadLibrary("sap.ui.core", "find/my/lib/here"); // async omitted (not autofixable)
	sap.ui.getCore().loadLibrary("sap.ui.core"); // async omitted (not autofixable)

	sap.ui.getCore().notifyContentDensityChanged();
});
