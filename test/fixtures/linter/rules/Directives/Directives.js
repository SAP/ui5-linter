sap.ui.define([
	// ui5lint-disable-next-line no-deprecated-api
	"sap/m/Button", "sap/m/DateTimeInput", "sap/base/util/includes", "sap/ui/Device", "sap/ui/core/library", "sap/ui/generic/app/navigation/service/NavigationHandler",
	// ui5lint-disable-next-line no-deprecated-api
	"sap/ui/table/Table", "sap/ui/table/plugins/MultiSelectionPlugin", "sap/ui/core/Configuration", "sap/m/library"
], function(Button, DateTimeInput, includes, Device, coreLib, NavigationHandler, Table, MultiSelectionPlugin, Configuration, mobileLib) {

	var dateTimeInput = new DateTimeInput(); // IGNORE: Control is deprecated. A finding only appears for the module dependency, not for the usage.

	var btn = new Button({
		blocked: true, // ui5lint-disable-line no-deprecated-api -- IGNORE: Property "blocked" is deprecated
		// ui5lint-disable-next-line no-deprecated-api
		tap: () => console.log("Tapped") // IGNORE: Event "tap" is deprecated
	});

	/* ui5lint-disable -- This is a comment */
	btn.attachTap(function() { // IGNORE: Method "attachTap" is deprecated
		console.log("Tapped");
	});
	/* ui5lint-enable */

	btn.attachTap(function() { // REPORT
		console.log("Tapped");
	});

	/* ui5lint-disable
		no-deprecated-api,
		no-deprecated-library,
		no-globals,
	*/
	var table = new Table({
		plugins: [ // IGNORE: Aggregation "plugins" is deprecated
			new MultiSelectionPlugin()
		],
		groupBy: "some-column" // IGNORE: Association "groupBy" is deprecated
	});
	/* ui5lint-enable no-deprecated-library */

	includes([1], 1); // IGNORE: Function "includes" is deprecated
	new sap.m.Button(); // IGNORE: Global usage

	const getIncludesFunction = () => includes;
	getIncludesFunction()([1], 1); // IGNORE: Function "includes" is deprecated
	/* ui5lint-enable */

	includes([1], 1); // REPORT: Function "includes" is deprecated
	new sap.m.Button(); // REPORT: Global usage

	/* ui5lint-disable-next-line */
	Configuration.getCompatibilityVersion("sapMDialogWithPadding"); // IGNORE: Method "getCompatibilityVersion" is deprecated
	/* ui5lint-disable-next-line */
	Configuration["getCompatibilityVersion"]("sapMDialogWithPadding"); // IGNORE: Method "getCompatibilityVersion" is deprecated

	/* ui5lint-disable-next-line no-deprecated-api */
	Device.browser.webview; // IGNORE: "webview" is deprecated
	// ui5lint-disable-next-line no-deprecated-api
	Device.browser["webview"]; // IGNORE: "webview" is deprecated

	Device.browser["webview"]; // REPORT: "webview" is deprecated

	// ui5lint-disable-next-line no-deprecated-api
	Configuration.AnimationMode; // IGNORE: Property "AnimationMode" (Enum) is deprecated

	// ui5lint-disable-next-line no-deprecated-api
	coreLib.MessageType; // IGNORE: Enum "MessageType" is deprecated

	// ui5lint-disable-next-line no-deprecated-api
	coreLib.MessageType; // ui5lint-enable-line -- REPORT: Enum "MessageType" is deprecated

	// ui5lint-disable-next-line no-deprecated-api -- Followed by an intentionally Empty line

	coreLib.MessageType; // REPORT: Enum "MessageType" is deprecated

	// ui5lint-disable-next-line no-deprecated-api
	let {BarColor, MessageType} = coreLib; // IGNORE: Enum "MessageType" is deprecated


	MessageType.Error;

	// ui5lint-disable-next-line no-deprecated-api
	let {BarColor: bt, MessageType: mt} = coreLib; // IGNORE: Enum "MessageType" is deprecated


	mt.Error;

	/*
		ui5lint-disable-next-line no-deprecated-api

		--

		Descriptive comment
	*/
	mobileLib.InputType.Date; // IGNORE: Enum value "InputType.Date" is deprecated

	const navigationHandler = new NavigationHandler({});
	// ui5lint-disable-next-line no-deprecated-api, no-deprecated-api
	navigationHandler.storeInnerAppState({}); // IGNORE: Method "storeInnerAppState" is deprecated


	// ui5lint-disable no-deprecated-api, no-globals
	new sap.m.Button(); // IGNORE: Global variable "sap"
	new Button({
		blocked: true, // IGNORE: Property "blocked" is deprecated
		tap: () => console.log("Tapped") // IGNORE: Event "tap" is deprecated
	});
	// ui5lint-enable

	new sap.m.Button(); // REPORT: Global variable "sap"
	new Button({
		blocked: true, // REPORT: Property "blocked" is deprecated
		tap: () => console.log("Tapped") // REPORT: Event "tap" is deprecated
	});
	return;
	// ui5lint-disable
});

new sap.m.Button({ // IGNORE: Global variable "sap"
	blocked: true, // IGNORE: Property "blocked" is deprecated
	tap: () => console.log("Tapped") // IGNORE: Event "tap" is deprecated
});
