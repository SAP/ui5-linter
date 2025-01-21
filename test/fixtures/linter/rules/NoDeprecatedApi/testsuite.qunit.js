sap.ui.define(function () {
	"use strict";
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
