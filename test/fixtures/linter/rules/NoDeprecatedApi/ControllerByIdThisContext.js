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
				// Settings this property causes the linter to not detect the "rerender"
				// as a deprecated API usage anymore.
				this.foo = true;
			}, this));
		}
	});
});
