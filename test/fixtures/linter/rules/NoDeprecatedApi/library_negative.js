/*!
 * ${copyright}
 */
sap.ui.define([
	"sap/ui/core/Lib",
], function (Library) {
	"use strict";
	
	Library.init({
		apiVersion: 2
	});
	
	Library["init"]({
		apiVersion: 2
	});

	// Should be ignored
	Library.load({
		apiVersion: 23
	});
	
	const LibInit = Library.init;
	LibInit({
		apiVersion: 2
	});

	const {init} = Library;
	init({
		apiVersion: 2
	});

	const {init: intRenames} = Library;
	intRenames({
		apiVersion: 2
	});
});
