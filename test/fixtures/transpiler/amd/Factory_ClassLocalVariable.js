sap.ui.define(["sap/ui/core/Control"], function(Control) {

	/* This comment should be above the "class" statement of ExampleControl1 after transpiling */
	const ExampleControl1 = Control.extend("test.ExampleControl1", {
		metadata: {},
		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
			}
		}
	});
	/* This comment should be below the "class" statement of ExampleControl1 after transpiling */

	const a = 1, ExampleControl2 = Control.extend("test.ExampleControl2", {});

	const b = 2,
		/* This comment should be above the "class" statement of ExampleControl3 after transpiling */
		ExampleControl3 = Control.extend("test.ExampleControl3", {}),
		c = 3, ExampleControl4 = Control.extend("test.ExampleControl4", {});

	/**
	 * JSDoc comments should be removed, as it might have negative impact on the type detection
	 */
	Control.extend("test.ExampleControl5", {
		metadata: {},
		renderer: (oRm, oControl) => {
		}
	});
	/* This comment should be below the "class" statement of ExampleControl5 after transpiling */

	(function() {
		const d = 4,
			/**
			 * JSDoc comments should be removed, as it might have negative impact on the type detection
			 */
			ExampleControl6 = Control.extend("test.ExampleControl6", {}),
			e = 5, ExampleControl7 = Control.extend("test.ExampleControl7", {});

		// This comment should be above the "class" statement of ExampleControl8 after transpiling
		Control.extend("test.ExampleControl8", {
			metadata: {},
			renderer: function(oRm, oControl) {
			}
		});
	})();

	// This comment should be above the "class" statement of ExampleControl9 after transpiling
	return Control.extend("test.ExampleControl9", {
		metadata: {},
		renderer(oRm, oControl) {
		}
	});
	// This comment should be below the "class" statement of ExampleControl9 after transpiling
});
