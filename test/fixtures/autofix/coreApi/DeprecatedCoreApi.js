sap.ui.define(["sap/ui/core/Core",], function(CoreRenamed) {
	CoreRenamed.attachInit(function() {console.log();});

	CoreRenamed.attachInitEvent(function() {console.log();});

	CoreRenamed.byFieldGroupId("id");
	CoreRenamed.byFieldGroupId(["id", "id2"]);

	CoreRenamed.byId("id");

	CoreRenamed.getControl("controlId");

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
