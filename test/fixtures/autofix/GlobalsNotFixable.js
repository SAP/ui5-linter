// Assignments to global variables should not be fixed/replaced
sap.ui.define([], function() {

	// Declaring globals might appear in tests
	window.sap.ushell = {};
	// Assignments can be with or without window prefix
	sap.ushell.Container = {
		getService: function() {
			return {};
		}
	};

});
