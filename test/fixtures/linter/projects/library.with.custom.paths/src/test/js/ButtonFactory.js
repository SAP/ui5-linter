sap.ui.define(["library/with/custom/paths/ButtonFactory"], function (ButtonFactory) {
	"use strict";

	ButtonFactory.createButton().attachTap(function (event) {
		alert(event.getSource());
	});
});
