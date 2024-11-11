declare module "sap/rules/ui/DecisionTableCellFormat" {
	import {DecisionTableCellFormat} from "sap/rules/ui/library";

	/**
	 * An enumeration that defines how a cell in a decision table is formulated by the rule creator.
	 *
	 * @deprecated (since 1.52.8) - use the property decisionTableFormat.
	 * @public
	*/
	export default DecisionTableCellFormat;
}

declare module "sap/rules/ui/DecisionTableFormat" {
	import {DecisionTableFormat} from "sap/rules/ui/library";

	/**
	 * An enumeration that decides the rendering format for decisionTable.
	 *
	 * @public
	*/
	export default DecisionTableFormat;
}

declare module "sap/rules/ui/ExpressionType" {
	import {ExpressionType} from "sap/rules/ui/library";

	/**
	 * An enumeration that defines the different business data types for an expression
	 *
	 * @public
	*/
	export default ExpressionType;
}

declare module "sap/rules/ui/RuleHitPolicy" {
	import {RuleHitPolicy} from "sap/rules/ui/library";

	/**
	 * An enumeration that defines the output when more than one rule in the decision table is matched for a given set of inputs.
	 *
	 * @deprecated (since 1.120.2) - to configure the settings, use the Manage Rules Project app or the Rule Authoring APIs.
	 * @public
	*/
	export default RuleHitPolicy;
}

declare module "sap/rules/ui/RuleType" {
	import {RuleType} from "sap/rules/ui/library";

	/**
	 * An enumeration that defines whether the rule is formulated as a table with multiple rules instead of a rule with a single associated condition.
	 *
	 * @public
	*/
	export default RuleType;
}
