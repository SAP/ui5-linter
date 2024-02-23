sap.ui.define([], function() {
	return {
		renderButton() {
			var msg = "Tapped";
			sap.ui.require(["sap/m/Button"], (Button) => {
				new Button({
					tap: () => console.log(msg) // Event "tap" is deprecated
				}).placeAt("button");
			});
		},
		renderInput() {
			console.log(`Not implemented`);
		}
	};
});
