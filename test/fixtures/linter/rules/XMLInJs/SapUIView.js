sap.ui.define([], () => {
	const oView = sap.ui.view({
		type: "XML",
		definition: `<mvc:View 
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
	oView2.placeAt("content");
	
	sap.ui.xmlview({
		viewContent: `<mvc:View 
			controllerName="ui5app.controller.Home" 
			displayBlock="true"
			xmlns="sap.m"
			xmlns:mvc="sap.ui.core.mvc"
			xmlns:core="sap.ui.core"> 
				<Button tap=".sayHello">
			</mvc:View>`,
	});
});
