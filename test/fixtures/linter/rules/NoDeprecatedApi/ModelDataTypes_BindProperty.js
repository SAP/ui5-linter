sap.ui.define(
	["sap/m/Input"],
	(Input) => {
		"use strict";

		const input = new Input();
		input.bindProperty("value", {
			path: "/age",
			type: "sap.ui.model.type.Integer",
			formatOptions: { minIntegerDigits: 2 },
			constraints: { maximum: 1000 },
		});
	}
);
