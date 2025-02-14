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

	const fragment4 = sap.ui.fragment({
		type: "HTML", // Should be ignored as analysis is only for XML fragments
		// Intentionally put XML content, so it must be skipped for compilation & analysis
		fragmentContent: `<core:FragmentDefinition
		xmlns="sap.m"
		xmlns:core="sap.ui.core">
			<Button tap=".sayHello">
		</core:FragmentDefinition>`,
	});
});
