/*!
 * ${copyright}
 */

/**
 * Initialization Code and shared classes of library sap.ui.unified.
 */
sap.ui.define(
	[
		"sap/ui/core/Lib",
		"sap/ui/unified/ColorPickerDisplayMode",
	],
	function (
		Library,
		ColorPickerDisplayMode,
	) {
		"use strict";

		/**
		 * Unified controls intended for both, mobile and desktop scenarios
		 *
		 * @namespace
		 * @alias sap.ui.unified
		 * @author SAP SE
		 * @version ${version}
		 * @since 1.28
		 * @public
		 */
		var thisLib = Library.init({
			name: "sap.ui.unified",
			apiVersion: 2,
			version: "${version}",
			dependencies: ["sap.ui.core"],
			designtime: "sap/ui/unified/designtime/library.designtime",
			types: [
				"sap.ui.unified.ColorPickerDisplayMode",
			],
		});

		// expose imported enum as property of library namespace, for documentation see ColorPickerDisplayMode.js
		thisLib.ColorPickerDisplayMode = ColorPickerDisplayMode;

		return thisLib;
	}
);
