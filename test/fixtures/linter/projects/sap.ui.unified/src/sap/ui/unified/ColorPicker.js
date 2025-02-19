sap.ui.define([
	// This file covers the case where a framework library contains a relative import
	// to a library module from which an implicit global is accessed.
	"./library"
], function (Library) {
	"use strict";

	var ColorPickerMode = Library['ColorPickerMode'],

		// This is a special case as ColorPickerDisplayMode is defined in its own module but also exported via the library module.
		// However, this export from the library module is not reflected in the types / api.json, so it is still reported as implicit global usage.
		ColorPickerDisplayMode = Library['ColorPickerDisplayMode'];
});
