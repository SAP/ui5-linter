sap.ui.require(["sap/ui/core/Fragment"], async (Fragment) => {
	const content = await Fragment.load({
		type: "XML",
		"definition": `<core:FragmentDefinition
		xmlns="sap.m"
		xmlns:core="sap.ui.core">
			<Button tap=".sayHello">
		</core:FragmentDefinition>`,
	});
});
