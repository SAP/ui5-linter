/*!
 * ${copyright}
 */

// Provides control library.with.custom.paths.Example2.
sap.ui.define(["sap/ui/core/Control"], function (Control) {
	"use strict";

	/**
	 * Constructor for a new <code>library.with.custom.paths.Example2</code> control.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Some class description goes here.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version ${version}
	 *
	 * @constructor
	 * @public
	 * @alias library.with.custom.paths.Example2
	 */
	var Example2 = Control.extend(
		"library.with.custom.paths.Example2",
		/** @lends library.with.custom.paths.Example2.prototype */ {
			metadata: {
				library: "library.with.custom.paths"
			}
		}
	);
	return Example2;
});
