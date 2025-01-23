// Usage of a global variable outside of a sap.ui.define factory should not be fixed/replaced
(function() {
	const button = new sap.m.Button();
	sap.ui.define([], function() {
		const comboBox = new sap.m.ComboBox();
	});
	const button2 = new sap.m.Button();
})();
