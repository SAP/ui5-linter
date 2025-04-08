sap.ui.define(["sap/ui/thirdparty/jquery"], async function (jQuery) {
	// // The usage of the globals jQuery / $ is deprecated. Therefore an autofix should be offered by UI5 linter.
	var myFancyControl = jQuery(".fancyContainer");

	var scrollbarWidthR = jQuery.position.scrollbarWidth();

	jQuery(".fancyContainer").addAriaLabelledBy("myFancyId");
	jQuery(".fancyContainer").removeAriaLabelledBy("myFancyId");
	jQuery(".fancyContainer").addAriaDescribedBy("myFancyId");
	jQuery(".fancyContainer").removeAriaDescribedBy("myFancyId");

	jQuery(".fancyContainer").cursorPos(3);
	var firstFocusDomref = jQuery(".fancyContainer").firstFocusableDomRef();
	var lastFocusDomref = jQuery(".fancyContainer").lastFocusableDomRef();
	var selectedText = jQuery(".fancyInput").getSelectedText();
	var hasTabIndex = jQuery(".fancyContainer").hasTabIndex();
	var parentWithAttributeFalse = jQuery(".fancyContainer").parentByAttribute("data-sap-ui-test", "false");
	var oRect = jQuery(".fancyContainer").rect();
	var isInRect = jQuery(".fancyContainer").rectContains(1, 7);
	jQuery(".fancyContainer").scrollLeftRTL(100);
	jQuery(".fancyContainer").scrollRightRTL(100);
	jQuery(".fancyContainer").enableSelection();
	jQuery(".fancyContainer").disableSelection();
	jQuery(".fancyInput").selectText(0, 10);
	jQuery(".fancyContainer").zIndex(200);
	var tabbableDomRefs = jQuery(":sapTabbable");
});