sap.ui.define(["sap/ui/core/Core"], function(Core) {
	"use strict";

	async function waitForCore(callback) {
		// Usage of Core.ready / Core.attachInit in a test starter testsuite
		// should not cause a false-positive for "prefer-test-starter"
		if (Core.ready) {
			Core.ready().then(callback);
		} else {
			Core.attachInit(callback);
		}
	}

	return {
		name: "QUnit test suite with deprecated themes (JS)",
		defaults: {
			page: "ui5://test-resources/sap/ui/demo/todo/Test.qunit.html?testsuite={suite}&test={name}",
			qunit: {
				version: 2
			},
			sinon: {
				version: 4
			},
			ui5: {
				language: "EN",
				theme: "sap_bluecrystal" // positive finding
			}
		},
		tests: {
			"unit/unitTests": {
				theme: "sap_belize", // negative finding (wrong place)
				title: "Unit tests for Todo App",
				ui5: {
					theme: 'sap_belize_plus', // positive finding
				}
			},
			"integration/opaTests": {
				title: "Integration tests for Todo App",
				ui5: {
					theme: `sap_belize_hcb`, // positive finding
				}
			}
		}
	};
});
