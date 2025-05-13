/*global QUnit */
sap.ui.define(() => {
	"use strict";

	QUnit.module("CharToUpperCase");

	QUnit.test("CharToUpperCase", function (assert) {
		assert.strictEqual("GggT", jQuery.sap.charToUpperCase("gggT"));
		assert.strictEqual("Gs4T", jQuery.sap.charToUpperCase("gs4T"));
		assert.strictEqual("GggT", jQuery.sap.charToUpperCase("gggT", 0));

		assert.strictEqual("GggT", jQuery.sap.charToUpperCase("gggT", -1));
		assert.strictEqual("GggT", jQuery.sap.charToUpperCase("gggT", -2));
		assert.strictEqual("GggT", jQuery.sap.charToUpperCase("gggT", "kgtzjrf"));

		assert.strictEqual("GggT", jQuery.sap.charToUpperCase("gggT", null));
	});
});
