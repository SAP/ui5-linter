sap.ui.define(["sap/base/strings/NormalizePolyfill", "jquery.sap.unicode"], function () {
	// https://github.com/SAP/ui5-linter/issues/527
	const isNFC = jQuery.sap.isStringNFC("test NFC string");
});
