export default {
	name: "QUnit test suite with deprecated themes (TS)",
	defaults: {
		page: "ui5://test-resources/ui5/walkthrough/Test.qunit.html?testsuite={suite}&test={name}",
		qunit: {
			version: 2
		},
		sinon: {
			version: 4
		},
		ui5: {
			language: "EN",
			theme: "sap_belize" // positive finding
		}
	},
	tests: {
		"unit/unitTests": {
			title: "UI5 TypeScript Walkthrough - Unit Tests",
			theme: "sap_bluecrystal" // positive finding
		},
		"integration/opaTests": {
			title: "Integration tests for Todo App",
			theme: "sap_horizon", // negative finding
		}
	}
};
