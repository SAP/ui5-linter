/*!
 * ${copyright}
 */
sap.ui.define([
	"sap/ui/core/Lib",
], function (Library) {
	"use strict";
	
	Library.init({
		apiVersion: 2,
		dependencies: [
			"sap.ui.core",
			"sap.m",
			"sap.f",
		]
	});
	
	Library["init"]({
		apiVersion: 2,
		dependencies: [
			"sap.ui.core",
			"sap.m",
			"sap.f",
		]
	});

	// Should be ignored
	Library.load({
		apiVersion: 23,
		dependencies: [
			"sap.ui.core",
			"sap.m",
			"sap.f",
		]
	});
	
	const LibInit = Library.init;
	LibInit({
		apiVersion: 2,
		dependencies: [
			"sap.ui.core",
			"sap.m",
			"sap.f",
		]
	});

	const {init} = Library;
	init({
		apiVersion: 2,
		dependencies: [
			"sap.ui.core",
			"sap.m",
			"sap.f",
		]
	});

	const {init: initRenames} = Library;
	initRenames({
		apiVersion: 2,
		dependencies: [
			"sap.ui.core",
			"sap.m",
			"sap.f",
		]
	});
});
