/*global QUnit */
sap.ui.define(() => {
	"use strict";

	QUnit.module("jQuery.sap.startsWith");

	QUnit.test("StartsWithOk", function (assert) {
		assert.ok(jQuery.sap.startsWith("abcde", "abc"), "'abcde' starts with 'abc'");
		assert.ok(jQuery.sap.startsWith("abCde", "abCd"), "'abCde' starts with 'abCd'");
		assert.ok(jQuery.sap.startsWith("abc de", "abc d"), "'abc de' starts with 'abc d'");
		assert.ok(jQuery.sap.startsWith("abc de", "abc "), "'abc de' starts with 'abc '");
		assert.ok(!(jQuery.sap.startsWith("abcde", "ac")), "'abcde' doesn't start with 'ac'");
		assert.ok(!(jQuery.sap.startsWith("abcde", "aB")), "'abcde' doesn't start with 'aB'");

		assert.ok(!(jQuery.sap.startsWith("abcde", "")), "'abcde' doesn't start with ''");
		assert.ok(!(jQuery.sap.startsWith("abcde", 10)), "'abcde' doesn't start with '10'");
		assert.ok(!(jQuery.sap.startsWith("abcde", null)), "'abcde' doesn't start with null");
	});

	QUnit.test("StartsWithFailed", function (assert) {
		try {
			jQuery.sap.startsWith(null, "abc");
			assert.ok(false, "exception should have been thrown");
		} catch (e) {
			assert.ok(true, "exception expected");
		}
	});

	QUnit.test("StartsWithIgnoreCaseOk", function (assert) {
		assert.ok(jQuery.sap.startsWithIgnoreCase("abcde", "Abc"), "'abcde' starts with 'abc'");
		assert.ok(jQuery.sap.startsWithIgnoreCase("abCde", "aBCd"), "'abCde' starts with 'aBCd'");
		assert.ok(jQuery.sap.startsWithIgnoreCase("abC de", "abc D"), "'abC de' starts with 'abc D'");
		assert.ok(jQuery.sap.startsWithIgnoreCase("abC de", "aBc "), "'abC de' starts with 'aBc '");
		assert.ok(!(jQuery.sap.startsWithIgnoreCase("abCde", "aC")), "'abCde' doesn't start with 'aC'");

		assert.ok(!(jQuery.sap.startsWithIgnoreCase("abcdE", "")), "'abcdE' doesn't start with ''");
		assert.ok(!(jQuery.sap.startsWithIgnoreCase("abcdE", 10)), "'abcdE' doesn't start with '10'");
		assert.ok(!(jQuery.sap.startsWithIgnoreCase("abcdE", null)), "'abcdE' doesn't start with null");
	});

	QUnit.test("StartsWithIgnoreCaseFailed", function (assert) {
		try {
			jQuery.sap.startsWithIgnoreCase(null, "aBc");
			assert.ok(false, "exception should have been thrown");
		} catch (e) {
			assert.ok(true, "exception expected");
		}
	});
});
