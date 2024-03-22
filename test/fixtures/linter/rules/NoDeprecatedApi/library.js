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
});
