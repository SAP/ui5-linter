sap.ui.define([], function() {
	return {
		renderButton() {
			sap.ui.require(["sap/m/Button"], (Button) => {
				new Button({
					tap: () => console.log("Tapped") // Event "tap" is deprecated
				}).placeAt("button");
			});
		}
	};
});
