sap.ui.define(
	["sap/m/Input", "sap/ui/model/type/Integer"],
	(Input, Integer) => {
		"use strict";

		const input = new Input({
			value: "{ path: '/names/0/amount', type: 'sap.ui.model.type.Integer' }",
		});
		
		input.applySettings({
			value: "{ path: '/names/0/amount', type: 'sap.ui.model.type.Integer' }",
		});

		const input2 = new Input({
			type: "MyType",
		});
	}
);
