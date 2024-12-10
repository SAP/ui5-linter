sap.ui.define([
	"sap/m/Button", "sap/m/DateTimeInput", "sap/base/util/includes", "sap/ui/Device", "sap/ui/core/library", "sap/ui/generic/app/navigation/service/NavigationHandler",
	"sap/ui/table/Table", "sap/ui/table/plugins/MultiSelectionPlugin", "sap/ui/core/Configuration", "sap/m/library", "sap/ushell/Container",
], function(Button, DateTimeInput, includes, Device, coreLib, NavigationHandler, Table, MultiSelectionPlugin, Configuration, mobileLib, Container) {

	var dateTimeInput = new DateTimeInput(); // Control is deprecated. A finding only appears for the module dependency, not for the usage.

	var btn = new Button({
		blocked: true, // Property "blocked" is deprecated
		tap: () => console.log("Tapped") // Event "tap" is deprecated
	});

	btn.attachTap(function() { // Method "attachTap" is deprecated
		console.log("Tapped");
	});

	var table = new Table({
		plugins: [ // Aggregation "plugins" is deprecated
			new MultiSelectionPlugin()
		],
		groupBy: "some-column" // Association "groupBy" is deprecated
	});

	includes([1], 1); // Function "includes" is deprecated

	const getIncludesFunction = () => includes;
	getIncludesFunction()([1], 1); // Function "includes" is deprecated

	Configuration.getCompatibilityVersion("sapMDialogWithPadding"); // Method "getCompatibilityVersion" is deprecated
	Configuration["getCompatibilityVersion"]("sapMDialogWithPadding"); // Method "getCompatibilityVersion" is deprecated

	Device.browser.webview; // Property "webview" is deprecated
	Device.browser["webview"]; // Property "webview" is deprecated

	Configuration.AnimationMode; // Property "AnimationMode" (Enum) is deprecated

	coreLib.MessageType; // Enum "MessageType" is deprecated

	let {BarColor, MessageType} = coreLib; // Enum "MessageType" is deprecated
	({MessageType} = coreLib); // Enum "MessageType" is deprecated
	MessageType.Error;

	let {BarColor, MessageType: mt} = coreLib; // Enum "MessageType" is deprecated
	({BarColor, MessageType: mt} = coreLib); // Enum "MessageType" is deprecated
	mt.Error;

	mobileLib.InputType.Date; // Enum value "InputType.Date" is deprecated

	const navigationHandler = new NavigationHandler({});
	navigationHandler.storeInnerAppState({}); // Method "storeInnerAppState" is deprecated

	// Detection of deprecated API in constructor when an ID is passed as first argument
	var btn2 = new Button("btn2", {
		blocked: true, // Property "blocked" is deprecated
		tap: () => console.log("Tapped"), // Event "tap" is deprecated

		...moreArgs // Should be ignored
	});

	await Container.createRenderer();
});
