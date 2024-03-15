/*!
 * ${copyright}
 */

/**
 * Initialization Code and shared classes of library library.with.custom.paths.
 */
sap.ui.define([
	"sap/ui/core/library",
	"sap/ui/core/Lib",
], function (coreLib, Library) {
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
		apiVersion: 2
	});


	// delegate further initialization of this library to the Core
	// Hint: sap.ui.getCore() must still be used to support preload with sync bootstrap!
	sap.ui.getCore().initLibrary({
		name: "library.with.custom.paths",
		version: "${version}",
		dependencies: [ // keep in sync with the ui5.yaml and .library files
			"sap.ui.core"
		],
		types: [
			"library.with.custom.paths.ExampleColor"
		],
		interfaces: [],
		controls: [
			"library.with.custom.paths.Example"
		],
		elements: [],
		noLibraryCSS: true
	});

	/**
	 * Some description about <code>library.with.custom.paths</code>
	 *
	 * @namespace
	 * @name library.with.custom.paths
	 * @author SAP SE
	 * @version ${version}
	 * @public
	 */
	var thisLib = library.with.custom.paths;

	/**
	 * Semantic Colors of the <code>library.with.custom.paths.Example</code>.
	 *
	 * @enum {string}
	 * @public
	 */
	thisLib.ExampleColor = {

		/**
		 * Default color (brand color)
		 * @public
		 */
		Default : "Default",

		/**
		 * Highlight color
		 * @public
		 */
		Highlight : "Highlight"

	};

	return thisLib;
});
