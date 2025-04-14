// These cases should not be autofixed.
// Creating a new module declaration (sap.ui.define) is not supported right now.

// https://github.com/SAP/ui5-linter/issues/520
jQuery.sap.assert(false, "That's an assert");

// https://github.com/SAP/ui5-linter/issues/521
const bundle = jQuery.sap.resources({
	url: "resources/i18n.properties"
});

// https://github.com/SAP/ui5-linter/issues/522
const logObject = jQuery.sap.log;
const myLogger = jQuery.sap.log.getLogger();
const myLog = jQuery.sap.log.getLog();
const myLog2 = jQuery.sap.log.getLogEntries();

const oLogListener = {};
oLogListener.onLogEntry = function (oLog) {
	//
};
jQuery.sap.log.addLogListener(oLogListener);
jQuery.sap.log.removeLogListener(oLogListener);

const level = jQuery.sap.log.getLevel();
const logLevel = jQuery.sap.log.Level;
const isLoggable = jQuery.sap.log.isLoggable(logLevel.DEBUG);

jQuery.sap.log.logSupportInfo(true);
jQuery.sap.log.debug("This is a debug log message");
jQuery.sap.log.error("This is a error log message");
jQuery.sap.log.fatal("This is a fatal log message");
jQuery.sap.log.info("This is a info log message");
jQuery.sap.log.trace("This is a trace log message");
jQuery.sap.log.warning("This is a warning log message");

// https://github.com/SAP/ui5-linter/issues/524
const myCSS = jQuery.sap.encodeCSS("+");
const myJS = jQuery.sap.encodeJS("\"");
const myURL = jQuery.sap.encodeURL("a/b?c=d&e");
const myURLParameters = jQuery.sap.encodeURLParameters({ a: true, b: "d e" });
const myHTML = jQuery.sap.encodeHTML("<p>My Text</p>");
const myXML = jQuery.sap.encodeXML("<Text text=\"MyText\" />");

// https://github.com/SAP/ui5-linter/issues/525
jQuery.sap.addUrlWhitelist("https", "example.com", 1337, "path");
jQuery.sap.clearUrlWhitelist();
var aEntries = jQuery.sap.getUrlWhitelist();
jQuery.sap.validateUrl("https://example.com");
jQuery.sap.removeUrlWhitelist(0);

// https://github.com/SAP/ui5-linter/issues/527
var textCamelVase = jQuery.sap.camelCase(" First Name Last ");
var textUpperCase = jQuery.sap.charToUpperCase("myValue", 0);
var textEscapedRegx = jQuery.sap.escapeRegExp("ab.c");
var textWithReplacedPlaceholder = jQuery.sap.formatMessage("Say '{0}'", ["Hello"]);
var hashCode = jQuery.sap.hashCode("test");
var textHyphenated = jQuery.sap.hyphen("fooBar");

// https://github.com/SAP/ui5-linter/issues/528
var aData1 = ["orange", "apple", "banana"];
var aData2 = ["orange", "banana"];
var diff = jQuery.sap.arraySymbolDiff(aData1, aData2);
var aData3 = ["orange", "orange", "banana"];
var sortedCleanedArray = jQuery.sap.unique(aData3);

// https://github.com/SAP/ui5-linter/issues/529
var areBothObjectsEqual = jQuery.sap.equal({ a: 1, b: 2 }, { a: 1, b: 2 });
jQuery.sap.each({ name: "me", age: 32 }, function (sKey, oValue) {
	console.log("key: " + sKey + ", value: " + oValue);
});
jQuery.sap.forIn({ name: "you", age: 42 }, function (sKey, oValue) {
	console.log("key: " + sKey + ", value: " + oValue);
});
var isObjectPlainObject = jQuery.isPlainObject({});
var parsedJS = jQuery.sap.parseJS("{name: 'me'}");
var clone = jQuery.sap.extend(true, {}, { name: "me" });
var timestampsnumber = jQuery.sap.now();
var props = jQuery.sap.properties({ url: sap.ui.require.toUrl(sap.ui.require.toUrl("testdata/test.properties")) });
var myUid = jQuery.sap.uid();
var v = jQuery.sap.Version("3.6.2");
var v2 = new jQuery.sap.Version("3.6.2");
myDialog = jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), myDialog);
jQuery.sap.setObject("name.lastname", "Miller", { name: { firstname: "me" } });
var myFirstName = jQuery.sap.getObject("name.firstname", 0, { name: { firstname: "me" } });

https://github.com/SAP/ui5-linter/issues/586
var myFancyControl = jQuery(".fancyContainer");

// https://github.com/SAP/ui5-linter/issues/578
var myFancyControl = jQuery(".fancyContainer").control();
