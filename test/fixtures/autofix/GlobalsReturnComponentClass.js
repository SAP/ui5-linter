sap.ui.define([], function () {
	"use strict";

	return sap.ui.core.UIComponent.extend("my.Component", {
		metadata: {
			manifest: "json"
		},
		init: function() {
			sap.ui.core.UIComponent.prototype.init.call(this);
		}
	});
});
