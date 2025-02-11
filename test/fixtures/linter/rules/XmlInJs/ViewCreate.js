sap.ui.define(
	["sap/ui/core/mvc/View", "sap/ui/core/mvc/XMLView"],
	async (View, XMLView) => {
		const oView = await View.create({
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

		const oView2 = await XMLView.create({
			"definition": `<mvc:View 
		controllerName="ui5app.controller.Home" 
		displayBlock="true"
		xmlns="sap.m"
		xmlns:mvc="sap.ui.core.mvc"
		xmlns:core="sap.ui.core"> 
		  <Button tap=".sayHello">
		</mvc:View>`,
		});
		oView2.placeAt("content");
		
		const oView3 = await View.create({
			type: "HTML", // Should be ignored as analysis is only for XML fragments
			// Intentionally put XML content, so it must be skipped for compilation & analysis
			definition: `<mvc:View 
		controllerName="ui5app.controller.Home" 
		displayBlock="true"
		xmlns="sap.m"
		xmlns:mvc="sap.ui.core.mvc"
		xmlns:core="sap.ui.core"> 
		  <Button tap=".sayHello">
		</mvc:View>`,
		});
		oView3.placeAt("content");
	}
);
