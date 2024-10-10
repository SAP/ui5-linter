sap.ui.define(["sap/ui/core/Control"], function(Control) {
	const ExampleControl1 = Control.extend("test.ExampleControl1", {});

	const a = 1, ExampleControl2 = Control.extend("test.ExampleControl2", {});

	const b = 2, ExampleControl3 = Control.extend("test.ExampleControl3", {}),
		c = 3, ExampleControl4 = Control.extend("test.ExampleControl4", {});

	Control.extend("test.ExampleControl5", {});

	(function() {
		const d = 4, ExampleControl6 = Control.extend("test.ExampleControl6", {}),
			e = 5, ExampleControl7 = Control.extend("test.ExampleControl7", {});
		Control.extend("test.ExampleControl8", {});
	})();

	return ExampleControl1;
});
