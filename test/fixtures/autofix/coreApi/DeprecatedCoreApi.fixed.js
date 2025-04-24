sap.ui.define(["sap/ui/core/Core",
	"sap/ui/core/Theming",
	"sap/ui/core/IntervalTrigger",
	"sap/base/i18n/Localization",
	"sap/ui/core/Control",
	"sap/ui/core/Element",
	"sap/ui/core/Component"
	], function(Core, Theming, IntervalTrigger, Localization, Control, Element, Component) {
	Theming.applyTheme("themeName");
	Core.applyTheme("custom_theme", "find/my/theme/here");

	Core.ready(function() {console.log();});

	Core.ready(function() {console.log();});

	IntervalTrigger.addListener(function() {console.log();});
	Core.attachIntervalTimer(function() {console.log();}, {});

	Localization.attachChange(function() {console.log();});
	Core.attachLocalizationChanged(function() {console.log();}, {});

	Theming.attachApplied(function() {console.log();});
	Core.attachThemeChanged(function() {console.log();}, {});

	Control.getControlsByFieldGroupId("id");
	Control.getControlsByFieldGroupId(["id", "id2"]);

	Element.getElementById("id");

	Component.create({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}});
	Component.create({name: "componentName", url: "find/my/comp/here", id: "id", settings: {"settingsKey": "..."}, component: {}});

	IntervalTrigger.removeListener(function() {console.log();});
	Core.detachIntervalTimer(function() {console.log();}, {});

	Localization.detachChange(function() {console.log();});
	Core.detachLocalizationChanged(function() {console.log();}, {});

	Theming.detachApplied(function() {console.log();});
	Core.detachThemeChanged(function() {console.log();}, {});

	Component.get("componentId");

	Element.getElementById("controlId");

	// Use replacement only if Element.getActiveElement() is != undefined:
	(Element.getActiveElement()) ? Element.getId(Element.getActiveElement()) : Core.getCurrentFocusedControlId();

	Element.getElementById("elementId");
});
