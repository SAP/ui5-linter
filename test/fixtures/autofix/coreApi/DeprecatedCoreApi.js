sap.ui.define(["sap/ui/core/Core",], function(Core) {
	Core.applyTheme("themeName");
	Core.applyTheme("customTheme", "find/my/theme/here"); // Should not be autofixed if there is a 2nd argument
	Core.applyTheme("customTheme", undefined); // Can be migrated when the 2nd argument is undefined

	Core.attachInit(function() {console.log();});

	Core.attachInitEvent(function() {console.log();});

	Core.attachIntervalTimer(function() {console.log();});
	Core.attachIntervalTimer(function() {}, {}); // Should not be autofixed if there is a 2nd argument

	Core.byFieldGroupId("id");
	Core.byFieldGroupId(["id", "id2"]);

	Core.byId("id");

	Core.createComponent({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}, component: {}, async: true}); // First argument must be an object containing async: true for autofix to be applied
	Core.createComponent({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}, component: {}}); // Not autofixable
	Core.createComponent("componentName", "find/my/comp/here", "id", {"settingsKey": "..."}); // First argument is a string (not autofixable)

	Core.detachIntervalTimer(function() {console.log();});
	Core.detachIntervalTimer(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	Core.getComponent("componentId");

	Core.getControl("controlId");

	Core.getCurrentFocusedControlId();

	Core.getElementById("elementId");

	Core.getEventBus();

	Core.getLibraryResourceBundle("sap.ui.core", "en_US");
	Core.getLibraryResourceBundle("sap.ui.core", "en_US", true); // bAsync is true (not autofixable)

	Core.getStaticAreaRef();

	Core.initLibrary({
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

	Core.isMobile();

	Core.isStaticAreaRef(oDomRef);

	Core.loadLibrary("sap.ui.core", true);
	Core.loadLibrary("sap.ui.core", {async: true, url: "find/my/lib/here"});
	Core.loadLibrary("sap.ui.core", {async: false, url: "find/my/lib/here"}); // async: false (not autofixable)
	Core.loadLibrary("sap.ui.core", {url: "find/my/lib/here"}); // async omitted (not autofixable)
	Core.loadLibrary("sap.ui.core", "find/my/lib/here"); // async omitted (not autofixable)
	Core.loadLibrary("sap.ui.core"); // async omitted (not autofixable)

	Core.notifyContentDensityChanged();
});
