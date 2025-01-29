sap.ui.define(
	["sap/m/Input", "sap/ui/model/type/Integer"],
	(Input, Integer) => {
		"use strict";

		const intType = new Integer(
			{ minIntegerDigits: 3 }, // format options
			{ maximum: 1000 } // constraint
		);
		const input = new Input({
			value: {
				path: "/names/0/amount",
				type: intType,
			},
		});
	}
);
