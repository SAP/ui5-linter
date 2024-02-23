sap.ui.define([], function() {
	return {
		renderButton() {
			sap.ui.require(["sap/m/Button"], (Button) => {
				new Button({
					tap: () => console.log("Tapped") // TODO detect: Event "tap" is deprecated
				}).placeAt("button");
			});
		}
	};
});
