import Ui5TypeInfoMatcher from "../../Ui5TypeInfoMatcher.js";
import {
	FixTypeInfoMatcher,
	propertyAssignmentFix,
} from "../FixFactory.js";

const t: FixTypeInfoMatcher = new Ui5TypeInfoMatcher("sap.ui.layout");
export default t;

t.declareModule("sap/ui/layout/form/SimpleForm", [
	t.managedObjectSetting("$SimpleFormSettings", [
		// Property "minWidth" is deprecated and should be removed
		t.metadataProperty("minWidth", propertyAssignmentFix({})),
	]),
]);
