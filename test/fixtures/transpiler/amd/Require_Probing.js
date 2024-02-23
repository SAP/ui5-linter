sap.ui.define([], function() {
	return {
		maybeTable() {
			var Table = sap.ui.require("sap/m/Table"); // Convert to import for Table
			if (Table) {
				var JSONModel = sap.ui.require("sap/ui/model/json/JSONModel");
				return new Table().setModel(new JSONModel());
			}
		}
	};
});
