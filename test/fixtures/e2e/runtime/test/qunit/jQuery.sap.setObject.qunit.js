/*global QUnit */
sap.ui.define(() => {
	"use strict";

	QUnit.module("jQuery.sap.setObject");

	QUnit.test("jQuery.sap.setObject", function (assert) {
		var oObject = {}, bar = "bar";

		assert.strictEqual(jQuery.sap.setObject(), undefined, "no params");

		jQuery.sap.setObject("foo", bar);
		assert.strictEqual(window.foo, bar, "foo, \"bar\"");
		delete window.foo;

		jQuery.sap.setObject("foo.foo.foo", bar);
		assert.strictEqual(window.foo.foo.foo, bar, "foo.foo.foo, \"bar\"");
		delete window.foo;

		jQuery.sap.setObject("foo", bar, oObject);
		assert.strictEqual(oObject.foo, bar, "foo, bar, {}");
		delete oObject.foo;

		jQuery.sap.setObject("foo.foo.foo", bar, oObject);
		assert.strictEqual(oObject.foo.foo.foo, bar, "foo.foo.foo, bar, {}");
		delete oObject.foo;
	});
});
