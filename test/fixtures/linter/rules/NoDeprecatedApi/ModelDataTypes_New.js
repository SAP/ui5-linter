sap.ui.define(["sap/m/Input"], (Input) => {
	const input = new Input({
		value: {
			path: "/names/0/amount",
			type: "sap.ui.model.type.Integer",
			formatOptions: { minIntegerDigits: 3 },
			constraints: { maximum: 1000 },
		},
	});
	
	input.applySettings({
		value: {
			path: "/names/0/amount",
			type: "sap.ui.model.type.Integer",
			formatOptions: { minIntegerDigits: 3 },
			constraints: { maximum: 1000 },
		},
	});
});
