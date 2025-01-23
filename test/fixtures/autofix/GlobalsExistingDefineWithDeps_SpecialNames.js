sap.ui.define([
	"sap/ui/thirdparty/sinon-qunit",
	"./controller/App.controller",
	"./../../library",
	"../other/library",
	"./library",
	"sap/m/Button",
], function() {
	const button = new sap.m.Button({
		text: "Hello"
	});
});
