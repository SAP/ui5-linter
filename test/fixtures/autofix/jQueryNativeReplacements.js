sap.ui.define(["sap/ui/thirdparty/jquery"], async function (jQuery) {
	var isStandAlone = jQuery.device.is.standalone;
	var retinaDisplay = jQuery.support.retina;
	var startsWithH = jQuery.sap.startsWith("Hello", "H");
	var startsWithHOrh = jQuery.sap.startsWithIgnoreCase("Hello", "h");
	var endsWithY = jQuery.sap.endsWith("Hello Y", "Y");
	var endsWithYOry = jQuery.sap.endssWithIgnoreCase("Hello Y", "y");
	var padLeft = jQuery.sap.padLeft("a", "0", 4); // returns "000a";
	var padRight = jQuery.sap.padRight("a", "0", 4); // returns "a000";

	var myObject = {};
	myObject.myFunction = function (param1, param2) { };
	var delayedCallId = jQuery.sap.delayedCall(1000, myObject, "myFunction", ["myParam1", "myParam2"]);
	jQuery.sap.clearDelayedCall(delayedCallId);
	var intervalCallId = jQuery.sap.intervalCall(1000, myObject, "myFunction", ["myParam1", "myParam2"]);
	jQuery.sap.clearIntervalCall(intervalCallId);

	var element = jQuery.sap.domById("popup");
	const divList = document.getElementsByTagName("div");
	var isEqNode = jQuery.sap.isEqualNode(divList[0], divList[0]);

	var person = { firstname: "Peter", lastname: "Miller" };
	var newObj = jQuery.sap.newObject(person);
	var getPerson = jQuery.sap.getter(person);

	var myData = ["a", "b", "c"];
	var indexOfEntity = jQuery.inArray("b", myData);
});