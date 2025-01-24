sap.ui.define(
	["sap/m/Input", "sap/ui/model/type/Integer"],
	(Input, Integer) => {
		"use strict";

		const intType = new Integer(
			{ minIntegerDigits: 2 }, // format options
			{ maximum: 1000 } // constraint
		);
		const input = new Input();

		input.bindProperty("value", {
			path: "/age",
			type: intType,
		});
	}
);
