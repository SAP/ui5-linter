sap.ui.define(["sap/m/Text"], (Text) => {
	const oText1 = new Text({
		text: "{= odata.compare(%{myvalue1},%{myvalue2})}"
	});
	const oText2 = new Text({
		text: "{= odata.fillUriTemplate(${myvalue1},${myvalue2})}"
	});
	oText2.applySettings({
		text: "{= odata.uriEncode(%{myvalue1},'Edm.String') + ' - ' + odata.uriEncode(%{myvalue2},'Edm.String') }"
	});
});
