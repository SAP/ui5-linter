sap.ui.define([], async function () {
	jQuery.sap.assert(false, "That's an assert");

	const bundle = jQuery.sap.resources({
		url: "resources/i18n.properties"
	});

	const myLogger = jQuery.sap.log.getLogger();
	const myLog = jQuery.sap.log.getLog();
	const myLog2 = jQuery.sap.log.getLogEntries();

	const oLogListener = {};
	oLogListener.onLogEntry: function(oLog) {
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

	jQuery.sap.addUrlWhitelist("https", "example.com", 1337, "path");
	jQuery.sap.clearUrlWhitelist();
	var aEntries = jQuery.sap.getUrlWhitelist();
	jQuery.sap.validateUrl("https://example.com");
	jQuery.sap.removeUrlWhitelist(0);

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
	jQuery.sap.setObject("name.lastname", "Miller", { name: { firstname: "me" } });
	var myFirstName = jQuery.sap.getObject("name.firstname", 0, { name: { firstname: "me" } });

	var currentParams = jQuery.sap.getUriParameters();
	var paramsByUrl = jQuery.sap.getUriParameters("/service?x=1&y=2&z=true");

	var isLandscape = jQuery.device.is.landscape;
	var isPortait = jQuery.device.is.portrait;
	var isDesktop = jQuery.device.is.desktop;
	var isPhone = jQuery.device.is.phone;
	var isTablet = jQuery.device.is.tablet;
	var isAndroidPhone = jQuery.device.is.android_phone;
	var isAndroidTablet = jQuery.device.is.android_tablet;
	var isIPhone = jQuery.device.is.iphone;
	var isIPad = jQuery.device.is.ipad;

	var osName = jQuery.os.os;
	var osVersion = jQuery.os.fVersion;
	var osVersionString = jQuery.os.version;
	var isAndroid = jQuery.os.Android;
	var isBlueBerry = jQuery.os.bb;
	var isIOS = jQuery.os.iOS;
	var isWinPhone = jQuery.os.winphone;
	var isWin = jQuery.os.win;
	var isLinux = jQuery.os.linux;
	var isMac = jQuery.os.mac;

	var isBChildOfAOrEqualA = jQuery.sap.containsOrEquals(document.getElementById("controlA"), document.getElementById("controlB"));
	var iScrollBegin = jQuery.sap.denormalizeScrollBeginRTL(100);
	var iScrollLeft = jQuery.sap.denormalizeScrollLeftRTL(101, document.getElementById("controlA"));
	var ownerWindow = jQuery.sap.ownerWindow(document.getElementById("controlA"));
	var size = jQuery.sap.scrollbarSize("myclassA", true);
	jQuery.sap.includeScript("myapp/fancy/awesome.js", "fancyAwesomeScript");
	jQuery.sap.includeStylesheet("myapp/fancy/style.css", "fancyStyleSheet");
	var isPatched = jQuery.sap.replaceDOM(document.getElementById("controlA"), document.getElementById("controlB"));
	var rem = jQuery.sap.pxToRem("16px");
	var px = jQuery.sap.remToPx("1rem");

	var isMouseEventEqual = jQuery.sap.checkMouseEnterOrLeave(new jQuery.Event("mouseup", {}), document.getElementById("controlA"));
	var myEventHandler = (event) => console.log(event.type)
	jQuery.sap.bindAnyEvent(myEventHandler);
	jQuery.sap.unbindAnyEvent(myEventHandler);
	var allCoveredEvents = jQuery.sap.ControlEvents;
	jQuery.sap.handleF6GroupNavigation(new jQuery.Event("keydown", {}));
	var isMouseEventDelayed = jQuery.sap.isMouseEventDelayed();
	var isSpecialKey = jQuery.sap.isSpecialKey(new jQuery.Event("keydown", {});
	var touchEventMode = jQuery.sap.touchEventMode;
	var keyCodeEnter = jQuery.sap.keycodes.ENTER;
	var sapcollapseall = jQuery.sap.PseudoEvents.sapcollapseall;
	jQuery.sap.disableTouchToMouseHandling();

	var entryAfterStart = jQuery.sap.measure.start("measureA", "This is measure A", "categoryX");
	var entryAfterAdd = jQuery.sap.measure.add("measureB", "This is measure B", 1335420000000, 1335420060000, 60000, 500);
	var entryAfterEnd = jQuery.sap.measure.end("measureA");
	var averageEntry = jQuery.sap.measure.average("measureA", "Average of measure A");
	jQuery.sap.measure.clear();
	var filteredEntries = jQuery.sap.measure.filterMeasurements((o) => { return o.categories.indexOf("categoryX") > -1 ? o : null; });
	var allEntries = jQuery.sap.measure.getAllMeasurements(true);
	var entry = jQuery.sap.measure.getMeasurement("measureB");
	var pausedEntry = jQuery.sap.measure.pause("measureB");
	var resumedEntry = jQuery.sap.measure.resume("measureB");
	var isActive = jQuery.sap.measure.getActive();
	var isStillActive = jQuery.sap.measure.setActive(true, ["categoryX", "categoryZ"]);
	jQuery.sap.measure.remove("measureA");
	var myFunctionObject = { myFunction: () => console.log("test") };
	var isRegisterSuccessful = jQuery.sap.measure.registerMethod("measureC", myFunctionObject, "myFunction");
	var isUnregisterSuccessful = jQuery.sap.measure.unregisterMethod("measureC", myFunctionObject, "myFunction");
	jQuery.sap.measure.unregisterAllMethods();

	await jQuery.sap.fesr.setActive(true);
	var isFESRActive = jQuery.sap.fesr.getActive();

	var frameOptions = new jQuery.sap.FrameOptions();

	var isActivityDetectionActive = jQuery.sap.act.isActive();

	jQuery.sap.initMobile();
	jQuery.sap.setIcons({
		'phone': 'phone-icon_60x60.png',
		'phone@2': 'phone-retina_120x120.png',
		'tablet': 'tablet-icon_76x76.png',
		'tablet@2': 'tablet-retina_152x152.png',
		'precomposed': true,
		'favicon': 'desktop.ico'
	});
	jQuery.sap.setMobileWebAppCapable(true);

	var store = jQuery.sap.storage(jQuery.sap.storage.Type.local, "mystore");

	var errorXML = "<?xml version=\"1.0\"><teamMembers><member firstName=\"Andreas\"</member></teamMembers>";
	var parseError = jQuery.sap.getParseError(jQuery.sap.parseXML(errorXML));
	var validXML = "<?xml version=\"1.0\"?><teamMembers><member firstName=\"Andreas\"</member></teamMembers>";
	var xmlDocument = jQuery.sap.serializeXML(jQuery.sap.parseXML(validXML));

	// The usage of the globals jQuery / $ is deprecated. Therefore an autofix should be offered by UI5 linter.
	var myFancyControl = jQuery(".fancyContainer");

	var scrollbarWidthR = jQuery.position.scrollbarWidth();

	var myFancyControl = jQuery(".fancyContainer").control();

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

	jQuery.sap.registerModulePath("ui5.project.moduleA", "/ui5/project/moduleA");
	jQuery.sap.registerModulePath("ui5.project.moduleB", { path: "/ui5/project/moduleB" });

	jQuery.sap.registerResourcePath("me/fancy/A", "ui5/projectA/");
	jQuery.sap.registerResourcePath("me/fancy/B", { url: "ui5/projectB/" });

	var buttonPath1 = jQuery.sap.getModulePath("sap.m.Button", "js"); // resolves to "resources/sap/m/Button.js"
	var buttonPath2 = jQuery.sap.getModulePath("sap.m.Button", "/"), // resolves to  "resources/sap/m/Button/"
	var buttonPath3 = jQuery.sap.getModulePath("sap.m.Button", ""), // resolves to "resources/sap/m/Button"
	var buttonPath4 = jQuery.sap.getResourcePath("sap/m/Button.js"); // resolves to "resources/sap/m/Button.js"
	var buttonPath5 = jQuery.sap.getResourcePath("sap.m/Button.js"); // resolves to "resources/sap/m/Button.js"

	var isBundle = jQuery.sap.resources.isBundle(new sap.base.i18n.ResourceBundle());

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