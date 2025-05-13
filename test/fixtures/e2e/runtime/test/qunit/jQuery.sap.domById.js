/*global QUnit */
sap.ui.define(() => {
	"use strict";

	QUnit.module("byId");

	QUnit.test("domById", function (assert) {
		assert.ok(jQuery.sap.domById('control1'), "jQuery.sap.domById('control1') may not be null");
		assert.ok(jQuery.sap.domById('contro1', window), "jQuery.sap.domById('control1') may not be null");
		assert.equal(jQuery.sap.domById('contro10'), null, "jQuery.sap.domById('control10') should be null");
	});
});
