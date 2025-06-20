/*global QUnit */
sap.ui.define(["sap/base/i18n/ResourceBundle"], (ResourceBundle) => {
	"use strict";

	QUnit.module("jQuery.sap.resources");

	QUnit.test("jQuery.sap.resources.isBundle", function (assert) {
		// https://github.com/SAP/ui5-linter/issues/521
		var myBundle = ResourceBundle.create({url : "i18n/messagebundle.properties"});
		var isBundle = jQuery.sap.resources.isBundle(myBundle);
		
		assert.ok(isBundle, "ResourceBundle is recognized as a bundle");
	});
});
