/*global QUnit */
sap.ui.define(() => {
	"use strict";

	QUnit.module("jQuery.sap.endsWith");

	QUnit.test("EndsWithOk", function (assert) {
		assert.ok(jQuery.sap.endsWith("abcde", "cde"), "'abcde' ends with 'cde'");
		assert.ok(jQuery.sap.endsWith("abc de", "c de"), "'abc de' ends with 'c de'");
		assert.ok(!(jQuery.sap.endsWith("abcde", "ce")), "'abcde' doesn't end with 'ce'");
		assert.ok(!(jQuery.sap.endsWith("abcde", "cDe")), "'abcde' doesn't end with 'cDe'");

		assert.ok(!(jQuery.sap.endsWith("abcde", "")), "'abcde' doesn't end with ''");
		assert.ok(!(jQuery.sap.endsWith("abcde", 10)), "'abcde' doesn't end with '10'");
		assert.ok(!(jQuery.sap.endsWith("abcde", null)), "'abcde' doesn't end with null");

		const emptyString = "";
		assert.ok(!(jQuery.sap.endsWith("abcde", emptyString)), "'abcde' doesn't end with ''");
	});

	QUnit.test("EndsWithFailed", function (assert) {
		try {
			jQuery.sap.endsWith(null, "abc");
			assert.ok(false, "exception should have been thrown");
		} catch (e) {
			assert.ok(true, "exception expected");
		}
	});

	QUnit.test("EndsWithIgnoreCaseOk", function (assert) {
		assert.ok(jQuery.sap.endsWithIgnoreCase("abcdE", "cDe"), "'abcdE' ends with 'cDe'");
		assert.ok(jQuery.sap.endsWithIgnoreCase("abcdE", "cDe"), "'abcdE' does end with 'cDe'");
		assert.ok(jQuery.sap.endsWith("abc De", "c De"), "'abc De' ends with 'c De'");
		assert.ok(!(jQuery.sap.endsWithIgnoreCase("abcdE", "cE")), "'abcdE' doesn't end with 'cE'");

		assert.ok(!(jQuery.sap.endsWithIgnoreCase("abcdE", "")), "'abcdE' doesn't end with ''");
		assert.ok(!(jQuery.sap.endsWithIgnoreCase("abcdE", 10)), "'abcdE' doesn't end with '10'");
		assert.ok(!(jQuery.sap.endsWithIgnoreCase("abcdE", null)), "'abcdE' doesn't end with null");

		const emptyString = "";
		assert.ok(!(jQuery.sap.endsWithIgnoreCase("abcdE", emptyString)), "'abcdE' doesn't end with ''");
	});

	QUnit.test("EndsWithIgnoreCaseFailed", function (assert) {
		try {
			jQuery.sap.endsWithIgnoreCase(null, "abC");
			assert.ok(false, "exception should have been thrown");
		} catch (e) {
			assert.ok(true, "exception expected");
		}
	});
});
