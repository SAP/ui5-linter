import Button from "sap/m/Button";
import DateTimeInput from "sap/m/DateTimeInput";
import includes from "sap/base/util/includes";
import Device from "sap/ui/Device";
import {MessageType} from "sap/ui/core/library";
import NavigationHandler from "sap/ui/generic/app/navigation/service/NavigationHandler";
import Table from "sap/ui/table/Table";
import MultiSelectionPlugin from "sap/ui/table/plugins/MultiSelectionPlugin";
import Configuration from "sap/ui/core/Configuration";
import {InputType} from "sap/m/library";
import MultiInput, { MultiInput$TokenChangeEvent } from "sap/m/MultiInput";
import IllustratedMessage, { $IllustratedMessageSettings as MessageSettings } from "sap/f/IllustratedMessage";
import { $AvatarSettings } from "sap/f/Avatar";
import "sap/m/ActionSelect";

var dateTimeInput = new DateTimeInput(); // Control is deprecated. A finding only appears for the module dependency, not for the usage.

var btn = new Button({
    "blocked": true, // Property "blocked" is deprecated
    tap: () => console.log("Tapped") // Event "tap" is deprecated
});

btn.attachTap(function () {
    console.log("Tapped");
});

var table = new Table({
    plugins: [
        new MultiSelectionPlugin()
    ],
    groupBy: "some-column" // Association "groupBy" is deprecated
});

includes([1], 1); // Function "includes" is deprecated

Configuration.getCompatibilityVersion("sapMDialogWithPadding"); // Method "getCompatibilityVersion" is deprecated
Configuration["getCompatibilityVersion"]("sapMDialogWithPadding"); // Method "getCompatibilityVersion" is deprecated

Device.browser.webview; // Property "webview" is deprecated
Device.browser["webview"]; // Property "webview" is deprecated

Configuration.AnimationMode; // Property "AnimationMode" (Enum) is deprecated

MessageType.Error; // Enum "MessageType" is deprecated

InputType.Date; // Enum value "InputType.Date" is deprecated

const navigationHandler = new NavigationHandler({});
navigationHandler.storeInnerAppState({}); // Method "storeInnerAppState" is deprecated

// Detection of deprecated API in constructor when an ID is passed as first argument
var btn2 = new Button("btn2", {
	blocked: true, // Property "blocked" is deprecated
	"tap": () => console.log("Tapped"), // Event "tap" is deprecated

	...moreArgs // Should be ignored
});

