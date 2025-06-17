import Ui5TypeInfoMatcher from "../../Ui5TypeInfoMatcher.js";
import {
	FixTypeInfoMatcher,
	propertyAssignmentFix,
} from "../FixFactory.js";

const t: FixTypeInfoMatcher = new Ui5TypeInfoMatcher("sap.m");
export default t;

t.declareModule("sap/m/Button", [
	t.managedObjectSetting("$ButtonSettings", [
		// Event handler "tap" => "press"
		t.metadataEvent("tap", propertyAssignmentFix({
			property: "press",
		})),
	]),
]);
