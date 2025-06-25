sap.ui.define(["sap/m/Label", "sap/ui/layout/form/SimpleForm",], function(Label, SimpleForm) {
	const oLabel = new Label({
		text: "Form Label"
	})
	const oForm = new SimpleForm("my-form", {
		minWidth : 1000,
		editable : true,
		layout :"ResponsiveGridLayout",
		labelSpanL : 12,
		labelSpanM : 12,
		columnsL : 1,
		columnsM : 1,
		emptySpanL : 0,
		content : [
			oLabel
		]
	});
});
