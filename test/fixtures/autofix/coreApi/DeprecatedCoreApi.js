sap.ui.define(["sap/ui/core/Core",], function(CoreRenamed) {
	CoreRenamed.applyTheme("themeName");
	CoreRenamed.applyTheme("customTheme", "find/my/theme/here"); // Should not be autofixed if there is a 2nd argument
	CoreRenamed.applyTheme("customTheme", undefined); // Can be migrated when the 2nd argument is undefined

	CoreRenamed.attachInit(function() {console.log();});

	CoreRenamed.attachInitEvent(function() {console.log();});

	CoreRenamed.byFieldGroupId("id");
	CoreRenamed.byFieldGroupId(["id", "id2"]);

	CoreRenamed.byId("id");

	CoreRenamed.createComponent({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}, component: {}, async: true}); // First argument must be an object containing async: true for autofix to be applied
	CoreRenamed.createComponent({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}, component: {}}); // Not autofixable
	CoreRenamed.createComponent("componentName", "find/my/comp/here", "id", {"settingsKey": "..."}); // First argument is a string (not autofixable)

	CoreRenamed.attachIntervalTimer(function() {
		CoreRenamed.applyTheme("themeName"); // TODO: Enable migration of internal argument's content␊
	});
	CoreRenamed.attachIntervalTimer(function() {}, {}); // Should not be autofixed if there is a 2nd argument
	CoreRenamed.detachIntervalTimer(function() {
		CoreRenamed.applyTheme("themeName"); // TODO: Enable migration of internal argument's content␊
	});
	CoreRenamed.detachIntervalTimer(function() {console.log();}, {}); // Should not be autofixed if there is a 2nd argument

	CoreRenamed.getComponent("componentId");

	CoreRenamed.getControl("controlId");

	CoreRenamed.getCurrentFocusedControlId();

	CoreRenamed.getElementById("elementId");

	CoreRenamed.getEventBus();

	CoreRenamed.getLibraryResourceBundle("sap.ui.core", "en_US");
	CoreRenamed.getLibraryResourceBundle("sap.ui.core", "en_US", true); // bAsync is true (not autofixable)

	CoreRenamed.getStaticAreaRef();

	CoreRenamed.initLibrary({
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

	CoreRenamed.isMobile();

	CoreRenamed.isStaticAreaRef(oDomRef);

	CoreRenamed.loadLibrary("sap.ui.core", true);
	CoreRenamed.loadLibrary("sap.ui.core", {async: true, url: "find/my/lib/here"});
	CoreRenamed.loadLibrary("sap.ui.core", {async: false, url: "find/my/lib/here"}); // async: false (not autofixable)
	CoreRenamed.loadLibrary("sap.ui.core", {url: "find/my/lib/here"}); // async omitted (not autofixable)
	CoreRenamed.loadLibrary("sap.ui.core", "find/my/lib/here"); // async omitted (not autofixable)
	CoreRenamed.loadLibrary("sap.ui.core"); // async omitted (not autofixable)

	CoreRenamed.notifyContentDensityChanged();
});
