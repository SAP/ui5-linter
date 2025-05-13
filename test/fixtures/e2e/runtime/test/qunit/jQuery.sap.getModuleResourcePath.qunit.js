/*global QUnit */
sap.ui.define(() => {
	"use strict";

	QUnit.module("getModulePath");

	QUnit.test("getModulePath", function (assert) {
		assert.strictEqual(jQuery.sap.getModulePath("sap/m/Button", ".js"), "resources/sap/m/Button.js");
		assert.strictEqual(jQuery.sap.getModulePath("sap/m/Button", "/"),  "resources/sap/m/Button/");
		assert.strictEqual(jQuery.sap.getModulePath("sap.m.Button", ""), "resources/sap/m/Button");
		var oMainDataSource = { settings: { localUri: "sap.ui.core.odata.v2.metadata.xml" } };
		assert.strictEqual(
			jQuery.sap.getModulePath(oMainDataSource.settings.localUri.replace(".xml", ""), ".xml"), 
			"resources/sap/ui/core/odata/v2/metadata.xml");
	});

	QUnit.module("getResourcePath");

	QUnit.test("getResourcePath", function (assert) {
		assert.strictEqual(jQuery.sap.getResourcePath("sap/m/Button.js"), "resources/sap/m/Button.js");
		assert.strictEqual(jQuery.sap.getResourcePath("sap.m/Button.js"), "resources/sap.m/Button.js");
		assert.strictEqual(jQuery.sap.getResourcePath("sap.m/Button", ".js"), "resources/sap.m/Button.js");
	});
});
