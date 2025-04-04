sap.ui.define(["sap/ui/thirdparty/jquery"], async function (jQuery) {
	jQuery.sap.assert(false, "That's an assert");

	const bundle = jQuery.sap.resources({
		url: "resources/i18n.properties"
	});

	const myLogger = jQuery.sap.log.getLogger();
	const myLog = jQuery.sap.log.getLog();
	const myLog2 = jQuery.sap.log.getLogEntries();

	const oLogListener = {};
	oLogListener.onLogEntry = function(oLog) {
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


	const myCSS = jQuery.sap.encodeCSS("+");
	const myJS = jQuery.sap.encodeJS("\"");
	const myURL = jQuery.sap.encodeURL("a/b?c=d&e");
	const myURLParameters = jQuery.sap.encodeURLParameters({ a: true, b: "d e" });
	const myHTML = jQuery.sap.encodeHTML("<p>My Text</p>");
	const myXML = jQuery.sap.encodeXML("<Text text=\"MyText\" />");

	var textCamelVase = jQuery.sap.camelCase(" First Name Last ");
	var textUpperCase = jQuery.sap.charToUpperCase("myValue", 0);
	var textEscapedRegx = jQuery.sap.escapeRegExp("ab.c");
	var textWithReplacedPlaceholder = jQuery.sap.formatMessage("Say '{0}'", ["Hello"]);
	var hashCode = jQuery.sap.hashCode("test");
	var textHyphenated = jQuery.sap.hyphen("fooBar");

	var aData1 = ["orange", "apple", "banana"];
	var aData2 = ["orange", "banana"];
	var diff = jQuery.sap.arraySymbolDiff(aData1, aData2);
	var aData3 = ["orange", "orange", "banana"];
	var sortedCleanedArray = jQuery.sap.unique(aData3);

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

	var isBChildOfAOrEqualA = jQuery.sap.containsOrEquals(document.getElementById("controlA"), document.getElementById("controlB"));
	var iScrollBegin = jQuery.sap.denormalizeScrollBeginRTL(100);
	var iScrollLeft = jQuery.sap.denormalizeScrollLeftRTL(101, document.getElementById("controlA"));
	var ownerWindow = jQuery.sap.ownerWindow(document.getElementById("controlA"));
	var size = jQuery.sap.scrollbarSize("myclassA", true);
	jQuery.sap.includeScript("myapp/fancy/awesome.js", "fancyAwesomeScript");
	jQuery.sap.includeStylesheet("myapp/fancy/style.css", "fancyStyleSheet");
	var isPatched = jQuery.sap.replaceDOM(document.getElementById("controlA"), document.getElementById("controlB"));

	var isMouseEventEqual = jQuery.sap.checkMouseEnterOrLeave(new jQuery.Event("mouseup", {}), document.getElementById("controlA"));
	var myEventHandler = (event) => console.log(event.type)
	jQuery.sap.bindAnyEvent(myEventHandler);
	jQuery.sap.unbindAnyEvent(myEventHandler);
	var allCoveredEvents = jQuery.sap.ControlEvents;
	jQuery.sap.handleF6GroupNavigation(new jQuery.Event("keydown", {}));
	var isMouseEventDelayed = jQuery.sap.isMouseEventDelayed();
	var isSpecialKey = jQuery.sap.isSpecialKey(new jQuery.Event("keydown", {}));
	var touchEventMode = jQuery.sap.touchEventMode;
	var keyCodeEnter = jQuery.sap.keycodes.ENTER;
	var sapcollapseall = jQuery.sap.PseudoEvents.sapcollapseall;

	var frameOptions = new jQuery.sap.FrameOptions();

	jQuery.sap.registerModulePath("ui5.project.moduleA", "/ui5/project/moduleA");
	jQuery.sap.registerModulePath("ui5.project.moduleB", { path: "/ui5/project/moduleB" });

	jQuery.sap.registerResourcePath("me/fancy/A", "ui5/projectA/");
	jQuery.sap.registerResourcePath("me/fancy/B", { url: "ui5/projectB/" });

	var buttonPath1 = jQuery.sap.getModulePath("sap.m.Button", "js"); // resolves to "resources/sap/m/Button.js"
	var buttonPath2 = jQuery.sap.getModulePath("sap.m.Button", "/"); // resolves to  "resources/sap/m/Button/"
	var buttonPath3 = jQuery.sap.getModulePath("sap.m.Button", ""); // resolves to "resources/sap/m/Button"
	var buttonPath4 = jQuery.sap.getResourcePath("sap/m/Button.js"); // resolves to "resources/sap/m/Button.js"
	var buttonPath5 = jQuery.sap.getResourcePath("sap.m/Button.js"); // resolves to "resources/sap/m/Button.js"
});
