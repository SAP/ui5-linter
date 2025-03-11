sap.ui.define(function() {
	const avatarDOM = jQuery("#container-todo---app--avatar-profile");
	const list = sap.ui.getCore().byId("container-todo---app--todoList");
	const button = new sap.m.Button({
		text: "Hello"
	});
	const button2 = new window.sap.m.Button({
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

	// Note: This can't be replaced as it's just a global shortcut without a corresponding module
	const message = sap.ui.core.message;

	// Technically, this could be replaced, but as it's currently not reported as global usage, it is not replaced.
	// This might be improved in future, though.
	var oMessage1 = new message.Message({
		message: "First Error Message",
		type: sap.ui.core.MessageType.Error
	});
});
