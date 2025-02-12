sap.ui.define(["sap/m/Text", "sap/ui/model/odata/ODataExpressionAddons"], (Text) => {
	const oText1 = new Text({
		text: "{= odata.compare(%{myvalue1},%{myvalue2})}"
	});
	const oText2 = new Text({
		text: "{= odata.fillUriTemplate(${myvalue1},${myvalue2})}"
	});
	oText2.applySettings({
		text: "{= odata.uriEncode(%{myvalue1},'Edm.String') + ' - ' + odata.uriEncode(%{myvalue2},'Edm.String') }"
	});
	oText2.applySettings({
		text: `\\{"foo": "bar"}` // Escaped JSON string should not cause issues when checking for odata globals within a binding
	});
});
