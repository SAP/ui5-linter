sap.ui.define([], function () {
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

	// https://github.com/SAP/ui5-linter/issues/542
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

	// https://github.com/SAP/ui5-linter/issues/543
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
	jQuery.sap.disableTouchToMouseHandling();

	// https://github.com/SAP/ui5-linter/issues/555
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

	// https://github.com/SAP/ui5-linter/issues/561
	await jQuery.sap.fesr.setActive(true);
	var isFESRActive = jQuery.sap.fesr.getActive();
	
	jQuery.sap.fesr.addBusyDuration(33);
	await jQuery.sap.interaction.setActive(true);
	var isInteractionTrackingActive = jQuery.sap.interaction.getActive();
	jQuery.sap.interaction.notifyStepStart("startup", "startup", true);
	jQuery.sap.interaction.notifyStepEnd(true);
	jQuery.sap.interaction.notifyEventStart(myClickEvent);
	jQuery.sap.interaction.notifyScrollEvent(myScrollEvent)
	jQuery.sap.interaction.notifyEventEnd();
	jQuery.sap.interaction.setStepComponent("component-fancy");
	jQuery.sap.measure.startInteraction("click", myButton);
	jQuery.sap.measure.endInteraction(true);
	jQuery.sap.measure.clearInteractionMeasurements();
	var filteredMeasurements = jQuery.sap.measure.filterInteractionMeasurements(() => true);
	var allMeasurements = jQuery.sap.measure.getAllInteractionMeasurements();
	var pendigngMeasurement = jQuery.sap.measure.getPendingInteractionMeasurement();
	
	var transactionId = jQuery.sap.fesr.getCurrentTransactionId();
	var rootId = jQuery.sap.fesr.getRootId()
	jQuery.sap.passport.setActive(true);
	var traceLevel = jQuery.sap.passport.traceFlags("medium");
	
	// https://github.com/SAP/ui5-linter/issues/562
	var frameOptions = new jQuery.sap.FrameOptions();

	// https://github.com/SAP/ui5-linter/issues/563
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

	// TODO: Requires couple runs!
	// 1. Replace global "jQuery.sap.storage.Type.local"
	// 2. Replace the code with the following:
	// -> var store = new Storage(Storage.Type.local, "mystore");
	// var store = jQuery.sap.storage(jQuery.sap.storage.Type.local, "mystore");

	var errorXML = "<?xml version=\"1.0\"><teamMembers><member firstName=\"Andreas\"</member></teamMembers>";
	var parseError = jQuery.sap.getParseError(jQuery.sap.parseXML(errorXML));
	var validXML = "<?xml version=\"1.0\"?><teamMembers><member firstName=\"Andreas\"</member></teamMembers>";
	var xmlDocument = jQuery.sap.serializeXML(jQuery.sap.parseXML(validXML));
});
