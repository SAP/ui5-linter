sap.ui.define(["sap/ui/thirdparty/jquery"], async function (jQuery) {
	// https://github.com/SAP/ui5-linter/issues/590

	var isStandAlone = jQuery.device.is.standalone;
	var retinaDisplay = jQuery.support.retina;
	var emptyString = "";
	var startsWithH = jQuery.sap.startsWith("Hello", "H");
	var startsWithH2 = jQuery.sap.startsWith();
	var startsWithEmptyString = jQuery.sap.startsWith("Hello", emptyString); // Should not be replaced as the old API returns false for empty string but built-in String#startsWith returns true
	var startsWithEmptyString2 = jQuery.sap.startsWith("Hello", ""); // Should not be replaced as the old API returns false for empty string but built-in String#startsWith returns true
	var startsWithEmptyString3 = jQuery.sap.startsWith("Hello", ''); // Should not be replaced as the old API returns false for empty string but built-in String#startsWith returns true
	var startsWithEmptyString4 = jQuery.sap.startsWith("Hello", ``); // Should not be replaced as the old API returns false for empty string but built-in String#startsWith returns true
	var startText = "Hello";
	var startsWithLetter = "h";
	jQuery.sap.startsWith(null, "H"); // Throws an exception, but is that way in the legacy code
	var startsWithH3 = jQuery.sap.startsWith(startText, "H");
	var startsWithH3 = jQuery.sap.startsWith(startText, startsWithLetter);
	var $1 = "$123"; // Usage of special characters for RegExp replacement should not cause issues
	var sName = jQuery.sap.startsWith($1,'$') ? $1 : encodeURIComponent($1);
	var startsWithHOrh = jQuery.sap.startsWithIgnoreCase("Hello", "h");
	var startsWithHOrh2 = jQuery.sap.startsWithIgnoreCase(startText, startsWithLetter);
	var startsWithHOrh3 = jQuery.sap.startsWithIgnoreCase(startText, startsWithLetter);
	var startsWithHOrh4 = jQuery.sap.startsWithIgnoreCase(startText, 10);
	var startsWithHOrh4 = jQuery.sap.startsWithIgnoreCase(startText, null);
	var endsWithY = jQuery.sap.endsWith("Hello Y", "Y");
	var endsWithY2 = jQuery.sap.endsWith("Hello Y", startsWithLetter);
	var endsWithY3 = jQuery.sap.endsWith(startText, startsWithLetter);
	var endsWithY4 = jQuery.sap.endsWith("abcde", 10);
	var endsWithY5 = jQuery.sap.endsWith("abcde", null);
	var endsWithEmptyString = jQuery.sap.endsWith("Hello", emptyString); // Should not be replaced as the old API returns false for empty string but built-in String#endsWith returns true
	var endsWithEmptyString2 = jQuery.sap.endsWith("Hello", ""); // Should not be replaced as the old API returns false for empty string but built-in String#endsWith returns true
	var endsWithYOry = jQuery.sap.endsWithIgnoreCase("Hello Y", "y");
	var endsWithYOry2 = jQuery.sap.endsWithIgnoreCase(startText, "y");
	var endsWithYOry3 = jQuery.sap.endsWithIgnoreCase(startText, startsWithLetter);
	var padLeft = jQuery.sap.padLeft("a", "0", 4);
	var padLeft2 = jQuery.sap.padLeft("a", "0000", 4);
	var padLeft3 = jQuery.sap.padLeft(startsWithLetter, "0", 4);
	var padLeft4 = jQuery.sap.padLeft(startsWithLetter, startsWithLetter, 4);
	var padLeft5 = jQuery.sap.padLeft(startsWithLetter, startText, 8); // Should not be replaced as "startText" is more than one char and the old API behaves differently
	var padRight = jQuery.sap.padRight("a", "0", 4);
	var padRight2 = jQuery.sap.padRight("a", "0000", 4);
	var padRight3 = jQuery.sap.padRight(startsWithLetter, "0", 4);
	var padRight4 = jQuery.sap.padRight(startsWithLetter, startsWithLetter, 4);
	var padRight5 = jQuery.sap.padRight(startsWithLetter, startText, 8); // Should not be replaced as "startText" is more than one char and the old API behaves differently

	var myObject = {};
	myObject.myFunction = function(param1, param2) {};
	var delayedCallId = jQuery.sap.delayedCall(1000, myObject, "myFunction");
	var delayedCallId2 = jQuery.sap.delayedCall(1000, myObject, myObject.myFunction, ["myParam1"]);
	var delayedCallId3 = jQuery.sap.delayedCall(1000, window, Array.isArray, ["myParam1"]);
	var delayedCallId4 = jQuery.sap.delayedCall(1000, this, function () {
		var padRight = jQuery.sap.padRight("a", "0", 4); // Also migrate internal content
	}, ["myParam1", "myParam2"]);
	// OPA tests use this to wait for something to be ready
	jQuery.sap.delayedCall(1000, this, function () {
		var padRight = jQuery.sap.padRight("a", "0", 4); // Also migrate internal content

		jQuery.sap.delayedCall(1000, this, function () {
			var padRight = jQuery.sap.padRight("a", "0", 4); // Also migrate internal content

			jQuery.sap.delayedCall(1000, this, function () {
				var padRight = jQuery.sap.padRight("a", "0", 4); // Also migrate internal content
			});
		});
	});
	
	jQuery.sap.clearDelayedCall(delayedCallId);
	var intervalCallId = jQuery.sap.intervalCall(1000, myObject, "myFunction");
	var intervalCallId2 = jQuery.sap.intervalCall(1000, myObject, myObject.myFunction, ["myParam1"]);
	var intervalCallId3 = jQuery.sap.intervalCall(1000, window, Array.isArray, ["myParam1"]);
	var intervalCallId4 = jQuery.sap.intervalCall(1000, this, function () {
		var padRight = jQuery.sap.padRight("a", "0", 4); // Also migrate internal content
	}, ["myParam1", "myParam2"]);
	jQuery.sap.clearIntervalCall(intervalCallId);

	const document = globalThis.document;
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
