sap.ui.define([], function() {
	const globalCore = sap.ui.getCore();
	
	globalCore.attachInit(function() {console.log();});
	sap.ui.getCore().attachInit(function() {console.log();});

	globalCore.attachInitEvent(function() {console.log();});
	sap.ui.getCore().attachInitEvent(function() {console.log();});

	sap.ui.getCore().byFieldGroupId("id");
	sap.ui.getCore().byFieldGroupId(["id", "id2"]);

	globalCore.byId("id");
	sap.ui.getCore().byId("id");

	globalCore.getControl("controlId");
	sap.ui.getCore().getControl("controlId");

	globalCore.getElementById("elementId");
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
