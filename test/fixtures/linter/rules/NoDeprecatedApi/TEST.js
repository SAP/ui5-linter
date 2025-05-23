sap.ui.define([
	"sap/m/Button"
], function(Button) {
	"use strict";

	var btn = new Button({
		blocked: true, // Property "blocked" is deprecated
		tap: () => console.log("Tapped") // Event "tap" is deprecated
	});

});
