import ts from "typescript";
import Ui5TypeInfoMatcher from "../../Ui5TypeInfoMatcher.js";
import {
	FixTypeInfoMatcher,
	propertyAssignmentGeneratorFix,
} from "../FixFactory.js";
import {getPropertyAssignmentInObjectLiteralExpression} from "../../utils/utils.js";

const t: FixTypeInfoMatcher = new Ui5TypeInfoMatcher("sap.ui.layout");
export default t;

t.declareModule("sap/ui/layout/form/SimpleForm", [
	t.managedObjectSetting("$SimpleFormSettings", [
		// Property "minWidth" is deprecated and should be removed
		t.metadataProperty("minWidth", propertyAssignmentGeneratorFix({
			validatePropertyAssignment: (context, helpers, node) => {
				// Validate that the minWidth property is being used
				if (!ts.isObjectLiteralExpression(node.parent)) {
					return false;
				}
				const layoutProp = getPropertyAssignmentInObjectLiteralExpression("layout", node.parent);
				if (layoutProp && ts.isStringLiteralLike(layoutProp.initializer)) {
					// We can safely remove minWidth if
					// the layout property is either NOT SET or
					// the layout property is NOT SET to "ResponsiveLayout" AND is not a binding
					return layoutProp.initializer.text !== "ResponsiveLayout" &&
						!(layoutProp.initializer.text.startsWith("{") && layoutProp.initializer.text.endsWith("}"));
				}

				return true;
			},
			generator: () => {
				// Remove the minWidth property
				return "";
			},
		})),
	]),
]);
