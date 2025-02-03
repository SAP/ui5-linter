sap.ui.require([], () => {
	const fragment = sap.ui.fragment({
		type: "XML",
		fragmentContent: `<Button tap=".sayHello">`,
	});
	
	const fragment2 = sap.ui.xmlfragment({
		fragmentContent: `<Button tap=".sayHello">`,
	});
});
