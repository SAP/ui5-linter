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

	// Delete can't be fixed in case the module export is deleted
	delete sap.ushell.Container;

	 // Deleting an inner property of a global module access can be fixed
	delete sap.ushell.Container.getService;

});
