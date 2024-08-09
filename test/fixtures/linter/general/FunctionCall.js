import values from "sap/base/util/values";
const getValues = () => values;
getValues()({foo: "bar"}); // Special case: CallExpression on a CallExpression
