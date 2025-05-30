sap.ui.define(["sap/ui/core/Core",], function(CoreRenamed) {
	CoreRenamed.applyTheme("themeName");
	CoreRenamed.applyTheme("customTheme", "find/my/theme/here"); // Should not be autofixed if there is a 2nd argument
	CoreRenamed.applyTheme("customTheme", undefined); // Can be migrated when the 2nd argument is undefined

	CoreRenamed.attachInit(function() {console.log();});

	CoreRenamed.attachInitEvent(function() {console.log();});

	CoreRenamed.byFieldGroupId("id");
	CoreRenamed.byFieldGroupId(["id", "id2"]);

	CoreRenamed.byId("id");

	CoreRenamed.getComponent("componentId");

	CoreRenamed.getControl("controlId");

	CoreRenamed.getCurrentFocusedControlId();

	CoreRenamed.getElementById("elementId");

	CoreRenamed.getEventBus();

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

	CoreRenamed.notifyContentDensityChanged();
});
