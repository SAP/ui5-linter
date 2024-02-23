/*!
 * ${copyright}
 */

sap.ui.define([], function () {
	"use strict";

	class ES6Class {
		toString() {
			return this.#join("", "");
		}
		#join() {
			// A private method
		}
	}

	return ES6Class;
});
