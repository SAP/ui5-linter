sap.ui.define(["sap/m/Button"], function(Button) {
	const ctrl = new Button();
	ctrl.$().control(document.body); // jQuery.fn.control is deprecated
	ctrl.$().control(document.body).getMetadata(); // jQuery.fn.control is deprecated
});
