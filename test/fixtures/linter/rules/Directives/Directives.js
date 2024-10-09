sap.ui.define([
	"sap/m/Button", "sap/m/DateTimeInput", "sap/base/util/includes", "sap/ui/Device", "sap/ui/core/library", "sap/ui/generic/app/navigation/service/NavigationHandler",
	"sap/ui/table/Table", "sap/ui/table/plugins/MultiSelectionPlugin", "sap/ui/core/Configuration", "sap/m/library"
], function(Button, DateTimeInput, includes, Device, coreLib, NavigationHandler, Table, MultiSelectionPlugin, Configuration, mobileLib) {

	// ui5lint-disable-next-line no-deprecated-api
	var dateTimeInput = new DateTimeInput(); // IGNORE: Control is deprecated. A finding only appears for the module dependency, not for the usage.

	var btn = new Button({
		blocked: true, // ui5lint-disable-line no-deprecated-parameter -- IGNORE: Property "blocked" is deprecated
		// ui5lint-disable-next-line no-deprecated-parameter
		tap: () => console.log("Tapped") // IGNORE: Event "tap" is deprecated
	});

	/* ui5lint-disable */
	btn.attachTap(function() { // IGNORE: Method "attachTap" is deprecated
		console.log("Tapped");
	});
	/* ui5lint-enable */

	btn.attachTap(function() { // REPORT
		console.log("Tapped");
	});

	/* ui5lint-disable
		no-deprecated-parameter,
		no-deprecated-api
	*/
	var table = new Table({
		plugins: [ // IGNORE: Aggregation "plugins" is deprecated
			new MultiSelectionPlugin()
		],
		groupBy: "some-column" // IGNORE: Association "groupBy" is deprecated
	});
	/* ui5lint-enable no-deprecated-parameter */

	includes([1], 1); // IGNORE: Function "includes" is deprecated

	const getIncludesFunction = () => includes;
	getIncludesFunction()([1], 1); // IGNORE: Function "includes" is deprecated
	/* ui5lint-enable */

	includes([1], 1); // REPORT: Function "includes" is deprecated

	/* ui5lint-disable-next-line */
	Configuration.getCompatibilityVersion("sapMDialogWithPadding"); // IGNORE: Method "getCompatibilityVersion" is deprecated
	/* ui5lint-disable-next-line */
	Configuration["getCompatibilityVersion"]("sapMDialogWithPadding"); // IGNORE: Method "getCompatibilityVersion" is deprecated

	/* ui5lint-disable-next-line no-deprecated-property */
	Device.browser.webview; // IGNORE: "webview" is deprecated
	// ui5lint-disable-next-line no-deprecated-property
	Device.browser["webview"]; // IGNORE: "webview" is deprecated

	Device.browser["webview"]; // REPORT: "webview" is deprecated

	// ui5lint-disable-next-line no-deprecated-property
	Configuration.AnimationMode; // IGNORE: Property "AnimationMode" (Enum) is deprecated

	// ui5lint-disable-next-line no-deprecated-property
	coreLib.MessageType; // IGNORE: Enum "MessageType" is deprecated

	// ui5lint-disable-next-line no-deprecated-property -- Followed by an intentionally Empty line
	coreLib.MessageType; // REPORT: Enum "MessageType" is deprecated

	// ui5lint-disable-next-line no-deprecated-property
	let {BarColor, MessageType} = coreLib; // IGNORE: Enum "MessageType" is deprecated
	// ui5lint-disable-next-line no-deprecated-property
	({MessageType} = coreLib); // IGNORE: Enum "MessageType" is deprecated
	MessageType.Error;

	// ui5lint-disable-next-line no-deprecated-property
	let {BarColor, MessageType: mt} = coreLib; // IGNORE: Enum "MessageType" is deprecated
	// ui5lint-disable-next-line no-deprecated-property
	({BarColor, MessageType: mt} = coreLib); // IGNORE: Enum "MessageType" is deprecated
	mt.Error;

	// ui5lint-disable-next-line no-deprecated-property
	mobileLib.InputType.Date; // IGNORE: Enum value "InputType.Date" is deprecated

	const navigationHandler = new NavigationHandler({});
	// ui5lint-disable-next-line no-deprecated-property, no-deprecated-api
	navigationHandler.storeInnerAppState({}); // IGNORE: Method "storeInnerAppState" is deprecated


	// ui5lint-disable no-deprecated-property, no-global
	new sap.m.Button({ // IGNORE: Global variable "sap"
		blocked: true, // IGNORE: Property "blocked" is deprecated
		tap: () => console.log("Tapped") // IGNORE: Event "tap" is deprecated
	});
	// ui5lint-enable

	new sap.m.Button({ // REPORT: Global variable "sap"
		blocked: true, // REPORT: Property "blocked" is deprecated
		tap: () => console.log("Tapped") // REPORT: Event "tap" is deprecated
	});
});
