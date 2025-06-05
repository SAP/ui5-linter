sap.ui.define([], function() {
	const globalCore = sap.ui.getCore();

	sap.ui.getCore().applyTheme("themeName");
	sap.ui.getCore().applyTheme("customTheme", "find/my/theme/here"); // Should not be autofixed if there is a 2nd argument
	sap.ui.getCore().applyTheme("customTheme", undefined); // Can be autofixed when the 2nd argument is undefined

	sap.ui.getCore().attachInit(function() {console.log();});

	globalCore.attachInitEvent(function() {console.log();});
	sap.ui.getCore().attachInitEvent(function() {console.log();});

	sap.ui.getCore().byFieldGroupId("id");
	sap.ui.getCore().byFieldGroupId(["id", "id2"]);

	globalCore.byId("id");
	sap.ui.getCore().byId("id");

	globalCore.getComponent("componentId");
	sap.ui.getCore().getComponent("componentId");

	sap.ui.getCore().getControl("controlId");

	globalCore.getCurrentFocusedControlId();
	sap.ui.getCore().getCurrentFocusedControlId();

	sap.ui.getCore().getElementById("elementId");

	globalCore.getEventBus();
	sap.ui.getCore().getEventBus();

	globalCore.getStaticAreaRef();
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

	globalCore.notifyContentDensityChanged();
	sap.ui.getCore().notifyContentDensityChanged();
});
