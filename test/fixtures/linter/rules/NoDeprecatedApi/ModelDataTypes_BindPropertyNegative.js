sap.ui.define(
	["sap/m/Input", "sap/ui/model/type/Integer"],
	(Input, Integer) => {
		"use strict";

		const input = new Input();
		input.bindProperty("value", {
			path: "/age",
			type: "sap.ui.model.type.Integer",
			formatOptions: { minIntegerDigits: 2 },
			constraints: { maximum: 1000 },
		});
		
		input.bindValue({
			path: "/age",
			type: "sap.ui.model.type.Integer",
			formatOptions: { minIntegerDigits: 2 },
			constraints: { maximum: 1000 },
		});
	}
);
