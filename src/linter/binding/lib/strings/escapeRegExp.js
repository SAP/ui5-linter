/*
 * This is a copy of the sap/base/strings/escapeRegExp.js module of the OpenUI5 project
 * https://github.com/SAP/openui5/blob/a4507f0d4f8a56cc881e8983479c8f9b21bfb96b/src/sap.ui.core/src/sap/base/strings/escapeRegExp.js
 */

var rEscapeRegExp = /[[\]{}()*+?.\\^$|]/g;

/**
 * Escapes all characters that would have a special meaning in a regular expression.
 *
 * This method can be used when a string with arbitrary content has to be integrated
 * into a regular expression and when the whole string should match literally.
 *
 * @example
 * sap.ui.require(["sap/base/strings/escapeRegExp"], function(escapeRegExp) {
 *
 *    var text = "E=m*c^2"; // text to search
 *    var search = "m*c";   // text to search for
 *
 *    text.match( new RegExp(              search  ) ); // [ "c" ]
 *    text.match( new RegExp( escapeRegExp(search) ) ); // [ "m*c" ]
 *
 * });
 *
 * @function
 * @since 1.58
 * @alias module:sap/base/strings/escapeRegExp
 * @param {string} sString String to escape
 * @returns {string} The escaped string
 * @public
 * @SecPassthrough {0|return}
 */
var fnEscapeRegExp = function (sString) {
	return sString.replace(rEscapeRegExp, "\\$&");
};
export default fnEscapeRegExp;
