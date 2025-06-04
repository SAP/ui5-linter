// There are some side-effects when calling checker APIs in TypeScript
// which lead to different behavior in the linter as it influences the
// availability of types for certain nodes.
// This file demonstrates one of such cases where the linter does not
// detect the usage of a deprecated API when the "this" context is set
// to the controller instance in jQuery.proxy.
// This did only appear when, in addition, the "this" context is modified,
// e.g. by setting a property on the controller instance.
// The linter does only report the usage of the deprecated "rerender" API
// when "checker.getTypeAtLocation" is called on the "jQuery.proxy" call
// expression, which seems to cause side-effects so that the "this" context
// inside is understood when asking for types of the nodes.
// It is unclear why this is the case, and whether it is a bug in TypeScript.
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/thirdparty/jquery",
], function (Controller, jQuery) {
	"use strict";
	return Controller.extend("test.view.App", {
		doSomething1: function() {
			setTimeout(jQuery.proxy(function() {
				var oControl = this.byId("someControl");
				oControl.rerender();
				// Only with this line, the side-effect of "getTypeAtLocation" for "jQuery.proxy" becomes relevant.
				// Otherwise the deprecation is still detected without the "getTypeAtLocation" call.
				this.foo = true;
			}, this));
		}
	});
});
