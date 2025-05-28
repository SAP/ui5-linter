sap.ui.define(["sap/ui/core/Core",
	"sap/ui/core/Theming",
	"sap/ui/core/IntervalTrigger",
	"sap/ui/core/Control",
	"sap/ui/core/Element",
	"sap/ui/core/Component",
	"sap/ui/core/EventBus",
	"sap/ui/core/Lib",
	"sap/ui/core/StaticArea",
	"sap/ui/Device"
	], function(Core, Theming, IntervalTrigger, Control, Element, Component, EventBus, Lib, StaticArea, Device) {
	Theming.setTheme("themeName");
	Core.applyTheme("customTheme", "find/my/theme/here");

	Core.ready(function() {console.log();});

	Core.ready(function() {console.log();});

	IntervalTrigger.addListener(function() {console.log();});
	Core.attachIntervalTimer(function() {console.log();}, {});

	Control.getControlsByFieldGroupId("id");
	Control.getControlsByFieldGroupId(["id", "id2"]);

	Element.getElementById("id");

	Component.create({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}});
	Core.createComponent({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}, component: {}}); // Not autofixable
	Core.createComponent("componentName", "find/my/comp/here", "id", {"settingsKey": "..."}); // First argument is a string (not autofixable)

	IntervalTrigger.removeListener(function() {console.log();});
	Core.detachIntervalTimer(function() {console.log();}, {});

	Component.getComponentById("componentId");

	Element.getElementById("controlId");

	// Use replacement only if Element.getActiveElement() is != undefined:
	Element.getActiveElement()?.getId() || null;

	Element.getElementById("elementId");

	EventBus.getInstance();

	Lib.getResourceBundleFor("sap.ui.core", "en_US");
	Core.getLibraryResourceBundle("sap.ui.core", "en_US", true);

	StaticArea.getDomRef();

	Lib.init({
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

	Device.browser.mobile;

	StaticArea.getDomRef() === oDomRef;

	Lib.load({name: "sap.ui.core"});
	Lib.load({name: "sap.ui.core", url: "find/my/lib/here"});
	Core.loadLibrary("sap.ui.core", {async: false, url: "find/my/lib/here"});
	Core.loadLibrary("sap.ui.core", {url: "find/my/lib/here"});
	Core.loadLibrary("sap.ui.core", "find/my/lib/here");
	Core.loadLibrary("sap.ui.core");

	Theming.notifyContentDensityChanged();
});
