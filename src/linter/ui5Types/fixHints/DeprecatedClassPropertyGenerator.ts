import ts from "typescript";
import type {FixHints} from "./FixHints.js";

const CLASS_PROPERTY_REPLACEMENTS = new Map<string, Map<string, FixHints>>([
	["sap/ui/comp/smarttable/SmartTable", new Map([
		["useExportToExcel", {
			classProperty: "useExportToExcel",
			classPropertyToBeUsed: "enableExport",
		}],
	])],
	["sap/ui/layout/form/SimpleForm", new Map([
		["minWidth", {
			classProperty: "minWidth",
			classPropertyToBeUsed: "",
		}],
	])],
	["sap/m/Button", new Map([
		["tap", {
			classProperty: "tap",
			classPropertyToBeUsed: "press",
		}],
	])],
]);

export default class DeprprecatedClassPropertyGenerator {
	getFixHints(node: ts.PropertyAssignment, propertyName: string, className: string): FixHints | undefined {
		const fixHint = CLASS_PROPERTY_REPLACEMENTS.get(className)?.get(propertyName);
		return fixHint;
	}
}
