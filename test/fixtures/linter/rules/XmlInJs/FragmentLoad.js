sap.ui.require(["sap/ui/core/Fragment"], async (Fragment) => {
	const content = await Fragment.load({
		type: "XML",
		"definition": `<core:FragmentDefinition
		xmlns="sap.m"
		xmlns:core="sap.ui.core">
			<Button tap=".sayHello">
		</core:FragmentDefinition>`,
	});
	
	const content2 = await Fragment["load"]({
		type: "XML",
		definition: `<core:FragmentDefinition
		xmlns="sap.m"
		xmlns:core="sap.ui.core">
			<Button tap=".sayHello">
		</core:FragmentDefinition>`,
	});
	
	const content3 = await Fragment.load({
		type: "HTML", // Should be ignored as analysis is only for XML fragments
		// Intentionally put XML content, so it must be skipped for compilation & analysis
		definition: `<core:FragmentDefinition
		xmlns="sap.m"
		xmlns:core="sap.ui.core">
			<Button tap=".sayHello">
		</core:FragmentDefinition>`
	});
});
