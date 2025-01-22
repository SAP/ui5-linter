/*!
 * ${copyright}
 */
sap.ui.define([
	"sap/ui/core/Lib",
], function (Library) {
	"use strict";

	Library.init();
	Library.init("a");
	Library.init({
		dependencies: []
	});
	Library.init({
		test: 12,
		dependencies: [
			"sap.ui.commons",
			"sap.ui.suite",
			"sap.ui.ux3",
			"sap.ui.vtm",
			"sap.uiext.inbox",
			"sap.webanalytics.core",
			'sap.zen.commons',
			`sap.zen.crosstab`,
		]
	});
	Library.init({
		apiVersion: "23"
	});
	Library.init({
		apiVersion: 11
	});
	Library.init({
		apiVersion: "2"
	});
	Library["init"]({
		apiVersion: 1,
		dependencies: [
			"sap.ui.commons",
			"sap.ui.suite",
			"sap.ui.ux3",
			"sap.ui.vtm",
			"sap.uiext.inbox",
			"sap.webanalytics.core",
			"sap.zen.commons",
			"sap.zen.crosstab",
		]
	});

	const LibInit = Library.init;
	LibInit({
		apiVersion: 1,
		dependencies: [
			"sap.ui.commons",
			"sap.ui.suite",
			"sap.ui.ux3",
			"sap.ui.vtm",
			"sap.uiext.inbox",
			"sap.webanalytics.core",
			"sap.zen.commons",
			"sap.zen.crosstab",
		]
	});

	const {init} = Library;
	init({
		apiVersion: 1,
		dependencies: [
			"sap.ui.commons",
			"sap.ui.suite",
			"sap.ui.ux3",
			"sap.ui.vtm",
			"sap.uiext.inbox",
			"sap.webanalytics.core",
			"sap.zen.commons",
			"sap.zen.crosstab",
		]
	});

	const {init: intRenames} = Library;
	intRenames({
		apiVersion: 1,
		dependencies: [
			"sap.ui.commons",
			"sap.ui.suite",
			"sap.ui.ux3",
			"sap.ui.vtm",
			"sap.uiext.inbox",
			"sap.webanalytics.core",
			"sap.zen.commons",
			"sap.zen.crosstab",
		]
	});
});
