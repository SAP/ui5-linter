sap.ui.define(["sap/m/Button", "sap/m/library", "sap/m/Avatar", "sap/m/ComboBox"], function(ButtonRenamed, { BackgroundDesign }) {
	const avatarDOM = jQuery("#container-todo---app--avatar-profile");
	const list = sap.ui.getCore().byId("container-todo---app--todoList");
	sap.m.BackgroundDesign.Solid
	const myDesign = BackgroundDesign.Solid;
	const button = new sap.m.Button({
		text: "Hello"
	});
	const button2 = new ButtonRenamed({
		text: "Hello"
	});
	const button3 = new window.sap.m.Button({
		text: "Hello"
	});
	const fileUploader = new sap.ui.unified.FileUploader({
		valueState: sap.ui.core.ValueState.Success
	});
	const core = sap.ui.core;
	const fileUploader2 = new sap.ui.unified.FileUploader({
		valueState: core.ValueState.Success
	});
	sap.ui.view("myView");
	sap.m.URLHelper.triggerSms();

	sap.ui.require(["sap/m/Dialog", "sap/m/MessageToast", "sap/f/library"], function(Dialog, MessageToast, fLib) {
		sap.f.AvatarType.Icon;
		fLib.AvatarType.Image;
	});
});
