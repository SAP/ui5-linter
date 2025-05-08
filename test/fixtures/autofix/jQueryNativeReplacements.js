sap.ui.define(["sap/ui/thirdparty/jquery"], async function (jQuery) {
	// https://github.com/SAP/ui5-linter/issues/590

	// TODO: Requires couple runs!
	// 1. Replace global "new sap.base.i18n.ResourceBundle()"
	// 2. Replace the code with the following:
	// -> var isBundle = new ResourceBundle() instanceof ResourceBundle;
	// var isBundle = jQuery.sap.resources.isBundle(new sap.base.i18n.ResourceBundle());

	var isStandAlone = jQuery.device.is.standalone;
	var retinaDisplay = jQuery.support.retina;
	var startsWithH = jQuery.sap.startsWith("Hello", "H");
	var startsWithH2 = jQuery.sap.startsWith();
	var startText = "Hello";
	var startsWithLetter = "h";
	var startsWithH3 = jQuery.sap.startsWith(startText, "H");
	var startsWithH3 = jQuery.sap.startsWith(startText, startsWithLetter);
	var startsWithHOrh = jQuery.sap.startsWithIgnoreCase("Hello", "h");
	var startsWithHOrh2 = jQuery.sap.startsWithIgnoreCase(startText, startsWithLetter);
	var endsWithY = jQuery.sap.endsWith("Hello Y", "Y");
	var endsWithY2 = jQuery.sap.endsWith("Hello Y", startsWithLetter);
	var endsWithY3 = jQuery.sap.endsWith(startText, startsWithLetter);
	var endsWithYOry = jQuery.sap.endsWithIgnoreCase("Hello Y", "y");
	var endsWithYOry2 = jQuery.sap.endsWithIgnoreCase(startText, "y");
	var endsWithYOry3 = jQuery.sap.endsWithIgnoreCase(startText, startsWithLetter);
	var padLeft = jQuery.sap.padLeft("a", "0", 4); // returns "000a";
	var padRight = jQuery.sap.padRight("a", "0", 4); // returns "a000";

	var myObject = {};
	myObject.myFunction = function(param1, param2) {};
	var delayedCallId = jQuery.sap.delayedCall(1000, myObject, "myFunction");
	var delayedCallId2 = jQuery.sap.delayedCall(1000, myObject, myObject.myFunction, ["myParam1"]);
	var delayedCallId3 = jQuery.sap.delayedCall(1000, window, Array.isArray, ["myParam1"]);
	jQuery.sap.clearDelayedCall(delayedCallId);
	var intervalCallId = jQuery.sap.intervalCall(1000, myObject, "myFunction");
	var intervalCallId2 = jQuery.sap.intervalCall(1000, myObject, myObject.myFunction, ["myParam1"]);
	var intervalCallId3 = jQuery.sap.intervalCall(1000, window, Array.isArray, ["myParam1"]);
	jQuery.sap.clearIntervalCall(intervalCallId);

	var element = jQuery.sap.domById("popup");
	var element2 = jQuery.sap.domById("popup", globalThis);
	var element3 = jQuery.sap.domById();
	const divList = document.getElementsByTagName("div");
	var isEqNode = jQuery.sap.isEqualNode(divList[0], divList[0]);

	var person = {firstname: "Peter", lastname: "Miller" };
	var newObj = jQuery.sap.newObject(person);
	var newObj2 = jQuery.sap.newObject();
	var newObj3 = jQuery.sap.newObject(null);
	var newObj4 = jQuery.sap.newObject({});
	var getPerson = jQuery.sap.getter(person);

	var myData = ["a", "b", "c"];
	var indexOfEntity = jQuery.inArray("b", myData);
	var isValueAnArray = jQuery.isArray(myData);
});