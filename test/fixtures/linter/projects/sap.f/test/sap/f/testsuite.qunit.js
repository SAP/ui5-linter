sap.ui.define(["sap/ui/core/Core"], function (Core) {

	function waitForCore(callback) {
		// Usage of Core.ready / Core.attachInit in a test starter testsuite
		// should not cause a false-positive for "prefer-test-starter"
		if (Core.ready) {
			Core.ready().then(callback);
		} else {
			Core.attachInit(callback);
		}
	}

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
