sap.ui.define(["sap/ui/thirdparty/jquery"], async function (jQuery) {
	jQuery.sap.addUrlWhitelist("https", "example.com", 1337, "path");
	jQuery.sap.clearUrlWhitelist();
	var aEntries = jQuery.sap.getUrlWhitelist();
	jQuery.sap.validateUrl("https://example.com");
	jQuery.sap.removeUrlWhitelist(0);

	jQuery.sap.setObject("name.lastname", "Miller", { name: { firstname: "me" } });
	var myFirstName = jQuery.sap.getObject("name.firstname", 0, { name: { firstname: "me" } });

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

	var rem = jQuery.sap.pxToRem("16px");
	var px = jQuery.sap.remToPx("1rem");

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

	var myFancyControl = jQuery(".fancyContainer").control();

	var isBundle = jQuery.sap.resources.isBundle({});
});
