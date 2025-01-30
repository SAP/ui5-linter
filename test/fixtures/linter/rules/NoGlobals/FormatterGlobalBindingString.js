sap.ui.define(
	["sap/m/Input", "ui5/walkthrough/model/formatter"],
  	(Input, formatter) => {
		// The following two cases using global notations should be detected:
		const input = new Input({
			value: "{ path: 'invoice>Status', formatter: 'ui5.walkthrough.model.formatter.statusText' }"
		});
		input.applySettings({
			value: "{ path: 'invoice>Status', formatter: 'ui5.walkthrough.model.formatter.statusText' }",
		});

		// Although the formatter property does not look like a global notation,
		// it should still be detected if it is a string:
		const input2 = new Input({
			value: "{ path: 'invoice>Status', formatter: 'formatter.statusText' }"
		});
	}
);
