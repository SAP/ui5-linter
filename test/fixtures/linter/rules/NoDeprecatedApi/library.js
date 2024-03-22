/*!
 * ${copyright}
 */
sap.ui.define([
	"sap/ui/core/Lib",
], function (Library) {
	"use strict";

	Library.init();
	Library.init("a");
	Library.init({});
	Library.init({
		test: 12
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
		apiVersion: 1
	});
	
	const LibInit = Library.init;
	LibInit({
		apiVersion: 1
	});

	const {init} = Library;
	init({
		apiVersion: 1
	});

	const {init: intRenames} = Library;
	intRenames({
		apiVersion: 1
	});
});
