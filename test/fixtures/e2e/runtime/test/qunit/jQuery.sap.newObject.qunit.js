/*global QUnit */
sap.ui.define(() => {
	"use strict";

	QUnit.module("newObject");

	QUnit.test("jQuery.sap.newObject", function (assert) {
		var oProto = {};
		var oObject = {};

		oObject.prototype = oProto;

		// assert.expect();
		var oNewObject = jQuery.sap.newObject(oObject);
		assert.strictEqual(typeof oNewObject, "object", "{} - typeof object");
		assert.strictEqual(oNewObject.prototype, oProto, "{} - prototype set");

		oNewObject = jQuery.sap.newObject(null);
		assert.strictEqual(typeof oNewObject, "object", "null - typeof object");
		assert.strictEqual(oNewObject.prototype, undefined, "null - prototype undefined");

		oNewObject = jQuery.sap.newObject();
		assert.strictEqual(typeof oNewObject, "object", "no param - typeof object");
		assert.strictEqual(oNewObject.prototype, undefined, "no param - prototype undefined");
	});
});
