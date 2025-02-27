sap.ui.define(["sap/ui/core/Control"], function (Control) {
	"use strict";

	/**
	 * Constructor for a new <code>example.library.Example</code> control.
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
	 * @alias example.library.Example
	 */
	var Example = Control.extend(
		"example.library.Example", /** @lends example.library.Example.prototype */ {
			metadata: {
				library: "example.library"
			}
		}
	);
	return Example;
});
