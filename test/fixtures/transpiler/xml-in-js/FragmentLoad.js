sap.ui.require(["sap/ui/core/Fragment"], async (Fragment) => {
	const content = await Fragment.load({
		type: "XML",
		definition: `<Button tap=".sayHello">`,
	});
});
