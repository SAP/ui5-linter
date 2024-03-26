sap.ui.require(["sap/m/Button"], (Button) => {
	new Button({
		tap: () => console.log("Tapped") // Event "tap" is deprecated
	}).placeAt("button");
});
