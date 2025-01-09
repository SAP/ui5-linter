// This file ensures that returning a Promise in a *.qunit.js file
// does not cause a false-positive for the "prefer-test-starter" rule.
sap.ui.define([], function() {
	"use strict";

	QUnit.module("Foo");

	QUnit.test("1 + 1 = 2", function (assert) {
		assert.strictEqual(1 + 1, 2);
	});

	return new Promise(function(resolve) {
		resolve();
	});
});
