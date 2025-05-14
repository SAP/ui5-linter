/*global QUnit */
sap.ui.define(["sap/base/util/isEmptyObject"], (isEmptyObject) => {
	"use strict";

	var myObject;

	QUnit.module("jQuery.sap.extend", {
		beforeEach: function () {
			myObject = {
				prop1: "test",
				prop2: [0, 1, 2],
				prop3: 2,
				prop4: null,
				prop5: undefined,
				prop6: {
					prop61: "test",
					prop62: [0, 2, 3],
					prop63: undefined,
					prop64: null,
					prop65: 2
				}
			};
		},
		afterEach: function () {
			myObject = undefined;
		}
	});

	QUnit.test("extend deep", function (assert) {
		var oClone = jQuery.sap.extend(true, {}, myObject);
		assert.ok(typeof (oClone) == "object", "object clone created");
		assert.ok(!isEmptyObject(oClone), "clone not plain object");
		assert.ok(myObject !== oClone, "object cloned successfully");
		assert.ok(myObject.prop6 !== oClone.prop6, "deep clone");
		assert.equal(myObject.prop1, oClone.prop1, "property cloned successfully");
		assert.ok(myObject.prop2 !== oClone.prop2, "property cloned successfully");
		assert.ok(Array.isArray(oClone.prop2), "property cloned successfully");
		assert.equal(myObject.prop3, oClone.prop3, "property cloned successfully");
		assert.equal(myObject.prop4, oClone.prop4, "property cloned successfully");
		assert.equal(myObject.prop5, oClone.prop5, "property cloned successfully");
	});
});
