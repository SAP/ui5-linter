import Ui5TypeInfoMatcher from "../../Ui5TypeInfoMatcher.js";
import {FixScope} from "../BaseFix.js";
import {callExpressionFix, FixTypeInfoMatcher} from "../FixFactory.js";

const t: FixTypeInfoMatcher = new Ui5TypeInfoMatcher("global");
export default t;

t.declareNamespace("sap", [
	t.namespace("ui", [
		t.function("getCore", callExpressionFix({
			scope: FixScope.FullExpression,
			moduleName: "sap/ui/core/Core",
		})),
	]),
]);
