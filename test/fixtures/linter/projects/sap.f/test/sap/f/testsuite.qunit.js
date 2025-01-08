sap.ui.define(function () {
	"use strict";
	return {
		name: "QUnit test suite for sap.f",
		defaults: {
			page: "ui5://test-resources/sap/f/Test.qunit.html?testsuite={suite}&test={name}",
			qunit: {
				version: 2
			},
			sinon: {
				version: 4
			},
			ui5: {
				language: "EN",
				theme: "sap_horizon"
			}
		},
		tests: {
		}
	};
});
