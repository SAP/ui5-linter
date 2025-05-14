/*global QUnit */
sap.ui.define(() => {
	"use strict";

	QUnit.module("jQuery.sap.pad");

	QUnit.test("jQuery.sap.padLeft", function (assert) {
		assert.equal(jQuery.sap.padLeft("a", "123", 5), "123123a");
		const padChar = "123";
		assert.equal(jQuery.sap.padLeft("a", padChar, 5), "123123a");
	});

	QUnit.test("jQuery.sap.padRight", function (assert) {
		assert.equal(jQuery.sap.padRight("a", "123", 5), "a123123");
		const padChar = "123";
		assert.equal(jQuery.sap.padRight("a", padChar, 5), "a123123");
	});

});
