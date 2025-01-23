sap.ui.define(function() {
	// The following local names are the preferred unique names for sap/m/Button.
	// This test ensures that a new unique name is generated.
	const Button = new sap.m.Button();
	const {MButton} = {MButton: new sap.m.Button()};
	const [SapMButton] = [new sap.m.Button()];
	function SapMButton0() {
		return new sap.m.Button();
	}
});
