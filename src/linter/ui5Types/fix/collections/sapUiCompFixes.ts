import Ui5TypeInfoMatcher from "../../Ui5TypeInfoMatcher.js";
import {
	FixTypeInfoMatcher,
	propertyAssignmentFix,
} from "../FixFactory.js";

const t: FixTypeInfoMatcher = new Ui5TypeInfoMatcher("sap.ui.comp");
export default t;

t.declareModule("sap/ui/comp/smarttable/SmartTable", [
	t.managedObjectSetting("$SmartTableSettings", [
		// Property "useExportToExcel" => "enableExport"
		t.metadataProperty("useExportToExcel", propertyAssignmentFix({
			property: "enableExport",
		})),
	]),
]);
