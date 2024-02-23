sap.ui.define(["sap/ui/thirdparty/jquery"], function(jQuery) {
	var control = jQuery("#button").control(); // Error: jQuery#control is deprecated (sap/ui/dom/jquery/control)
	var outerHTML = jQuery("#button").outerHTML(); // TODO detect: jQuery#outerHTML is deprecated (jquery.sap.dom)
	jQuery("#content").root({}); // TODO detect: jQuery#root is deprecated (jquery.sap.ui)
	var uiarea = jQuery("#content").uiarea(0); // TODO detect: jQuery#uiarea is deprecated (jquery.sap.ui)
});
