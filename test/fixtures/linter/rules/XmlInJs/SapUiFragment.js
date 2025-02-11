sap.ui.require([], () => {
	const fragment = sap.ui.fragment({
		type: "XML",
		fragmentContent: `<core:FragmentDefinition
		xmlns="sap.m"
		xmlns:core="sap.ui.core">
			<Button tap=".sayHello">
		</core:FragmentDefinition>`,
	});

	const fragment2 = sap.ui.xmlfragment({
		"fragmentContent": `<core:FragmentDefinition
		xmlns="sap.m"
		xmlns:core="sap.ui.core">
			<Button tap=".sayHello">
		</core:FragmentDefinition>`,
	});
	
	const fragment3 = sap["ui"].xmlfragment({
		"fragmentContent": `<core:FragmentDefinition
		xmlns="sap.m"
		xmlns:core="sap.ui.core">
			<Button tap=".sayHello">
		</core:FragmentDefinition>`,
	});
});
