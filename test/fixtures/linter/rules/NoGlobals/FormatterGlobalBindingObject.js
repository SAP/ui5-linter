sap.ui.define(
	["sap/m/Input"],
  	(Input) => {
		const input = new Input({
			value: { path: 'invoice>Status', formatter: 'formatter.statusText' }
		});
	}
);
