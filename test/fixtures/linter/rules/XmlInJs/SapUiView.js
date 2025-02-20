sap.ui.define(["sap/ui/core/mvc/ViewType"], (ViewType) => {
	const oView = sap.ui.view({
		type: "XML",
		viewContent: `<mvc:View
			controllerName="ui5app.controller.Home"
			displayBlock="true"
			xmlns="sap.m"
			xmlns:mvc="sap.ui.core.mvc"
			xmlns:core="sap.ui.core">
				<Button tap=".sayHello">
			</mvc:View>`,
	});
	oView.placeAt("content");

	const oView2 = sap.ui.view({
		type: ViewType.XML,
		viewContent: `<mvc:View
			controllerName="ui5app.controller.Home"
			displayBlock="true"
			xmlns="sap.m"
			xmlns:mvc="sap.ui.core.mvc"
			xmlns:core="sap.ui.core">
				<Button tap=".sayHello">
			</mvc:View>`,
	});
	oView2.placeAt("content");

	const oView3 = sap.ui.xmlview({
		"viewContent": `<mvc:View
			controllerName="ui5app.controller.Home"
			displayBlock="true"
			xmlns="sap.m"
			xmlns:mvc="sap.ui.core.mvc"
			xmlns:core="sap.ui.core">
				<Button tap=".sayHello">
			</mvc:View>`,
	});
	oView3.placeAt("content");

	const oView4 = sap.ui.xmlview({
		viewContent: `<mvc:View controllerName="ui5app.controller.Home" displayBlock="true" xmlns="sap.m" xmlns:mvc="sap.ui.core.mvc" xmlns:core="sap.ui.core"><Button tap=".sayHello"></mvc:View>`,
	});
	oView4.placeAt("content");

	const sapUiXmlView = sap.ui.xmlview;
	const oView5 = sapUiXmlView({
		viewContent: `<mvc:View controllerName="ui5app.controller.Home" displayBlock="true" xmlns="sap.m" xmlns:mvc="sap.ui.core.mvc" xmlns:core="sap.ui.core"><Button tap=".sayHello"></mvc:View>`,
	});
	oView5.placeAt("content");
});
