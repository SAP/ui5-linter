sap.ui.define([
	'sap/m/Button',
	"sap/m/Avatar",
	'sap/m/ComboBox',
	`sap/m/Menu`
], function(
	ButtonRenamed,
	Avatar
) {
	const button = new sap.m.Button({
		text: "Hello"
	});
	const avatar = new sap.m.Avatar();
	new sap.m.Input();
});
