import Ui5TypeInfoMatcher from "../../Ui5TypeInfoMatcher.js";
import {FixScope} from "../BaseFix.js";
import {
	accessExpressionFix,
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
	t.class("Button", [
		t.method("attachTap", accessExpressionFix({
			scope: FixScope.FullExpression,
			propertyAccess: "attachPress",
		})),
		t.method("detachTap", accessExpressionFix({
			propertyAccess: "detachPress",
		})),
	]),
]);
