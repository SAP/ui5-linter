/*!
 * ${copyright}
 */

/*
 * IMPORTANT NOTICE
 * With 1.54, ui5loader.js and its new features are not yet a public API.
 * The loader must only be used via the well-known and documented UI5 APIs
 * such as sap.ui.define, sap.ui.require, etc.
 * Any direct usage of ui5loader.js or its features is not supported and
 * might break in future releases.
 */

/*global sap:true, Blob, console, document, Promise, URL, XMLHttpRequest */

(function(__global) {
	"use strict";

	/**
	 * Root namespace for JavaScript functionality provided by SAP SE.
	 *
	 * @version ${version}
	 * @namespace
	 * @public
	 * @name sap
	 */

	__global.sap = __global.sap || {};
	sap.ui = sap.ui || {};

	/**
	 * Provides access to UI5 loader configuration.
	 *
	 * The configuration is used by {@link sap.ui.require} and {@link sap.ui.define}.
	 *
	 * @public
	 * @namespace
	 * @ui5-global-only
	 */
	sap.ui.loader = {};

	/**
	 * @private
	 * @ui5-restricted bundles created with UI5 tooling
	 * @function
	 * @ui5-global-only
	 */
	sap.ui.predefine = predefine;

	/**
	 * Load a single module synchronously and return its module value.
	 *
	 * Basically, this method is a combination of {@link jQuery.sap.require} and {@link sap.ui.require}.
	 * Its main purpose is to simplify the migration of modules to AMD style in those cases where some dependencies
	 * have to be loaded late (lazy) and synchronously.
	 *
	 * The method accepts a single module name in the same syntax that {@link sap.ui.define} and {@link sap.ui.require}
	 * already use (a simplified variation of the {@link jQuery.sap.getResourcePath unified resource name}:
	 * slash separated names without the implicit extension '.js'). As for <code>sap.ui.require</code>,
	 * relative names (using <code>./</code> or <code>../</code>) are not supported.
	 * If not loaded yet, the named module will be loaded synchronously and the export value of the module will be returned.
	 * While a module is executing, a value of <code>undefined</code> will be returned in case it is required again during
	 * that period of time (e.g. in case of cyclic dependencies).
	 *
	 * <b>Note:</b> the scope of this method is limited to the sap.ui.core library. Callers are strongly encouraged to use
	 * this method only when synchronous loading is unavoidable. Any code that uses this method won't benefit from future
	 * performance improvements that require asynchronous module loading (e.g. HTTP/2). And such code never can comply with
	 * a content security policies (CSP) that forbids 'eval'.
	 *
	 * @param {string} sModuleName Module name in requireJS syntax
	 * @returns {any} Export value of the loaded module (can be <code>undefined</code>)
	 * @private
	 * @ui5-restricted sap.ui.core
	 * @function
	 * @ui5-global-only
	 * @deprecated As of version 1.120, sync loading is deprecated without replacement due to the deprecation
	 *   of sync XMLHttpRequests in the web standard.
	 */
	sap.ui.requireSync = requireSync;

}(globalThis));
