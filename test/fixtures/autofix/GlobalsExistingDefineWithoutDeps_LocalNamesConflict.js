sap.ui.define(["sap/m/Table"], function(Table) {
	// The following local names are the preferred unique names for sap/m/Button.
	// This test ensures that a new unique name is generated.
	const Button = new sap.m.Button();
	const {MButton} = {MButton: new sap.m.Button()};
	const [SapMButton] = [new sap.m.Button()];
	function SapMButton0() {
		return new sap.m.Button();
	}

	sap.ui.require([
		"sap/m/Input"
	], function() {
		const input = new sap.m.Input();
		const Button = new sap.m.Button();

		const mTable = new Table(); // Refers to sap/m/Table from sap.ui.define import
		const tableTable = new sap.ui.table.Table(); // Should refer to sap/ui/table/Table from sap.ui.require import
	});
});
