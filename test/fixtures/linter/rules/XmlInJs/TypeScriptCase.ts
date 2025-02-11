import View from "sap/ui/core/mvc/View";
import XMLView from "sap/ui/core/mvc/XMLView";
import Fragment from "sap/ui/core/Fragment";

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

const oView2 = XMLView.create({
	definition: `<mvc:View 
		controllerName="ui5app.controller.Home" 
		displayBlock="true"
		xmlns="sap.m"
		xmlns:mvc="sap.ui.core.mvc"
		xmlns:core="sap.ui.core"> 
		<Button tap=".sayHello">
		</mvc:View>`,
});
oView2.placeAt("content");

(async (Fragment) => {
	const content = await Fragment.load({
		type: "XML",
		definition: `<core:FragmentDefinition
		xmlns="sap.m"
		xmlns:core="sap.ui.core">
			<Button tap=".sayHello">
		</core:FragmentDefinition>`,
	});
})(Fragment);
