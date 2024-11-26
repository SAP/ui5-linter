sap.ui.define(["sap/ui/core/Control"], function(Control) {
	const Example1 = Control.extend("sap.ui.demo.linter.controls.Example1", {
		metadata: {},

		rerender: function() {
			console.log("Overriding rerender method");
			return Control.prototype.rerender.apply(this, arguments);
		},

		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.openEnd();
				oRm.close("div");
			}
		}
	});

	const Example2 = Control.extend("sap.ui.demo.linter.controls.Example2", {
		metadata: {},

		"rerender": function() {
			console.log("Overriding rerender method without calling super method");
		},

		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.openEnd();
				oRm.close("div");
			}
		}
	});

	const Example3 = Control.extend("sap.ui.demo.linter.controls.Example3", {
		metadata: {},

		rerender: () => {
			console.log("Overriding rerender method without calling super method");
		},

		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.openEnd();
				oRm.close("div");
			}
		}
	});

	const Example4 = Control.extend("sap.ui.demo.linter.controls.Example4", {
		metadata: {},

		rerender() {
			console.log("Overriding rerender method without calling super method");
		},

		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.openEnd();
				oRm.close("div");
			}
		}
	});

	const Example5 = Control.extend("sap.ui.demo.linter.controls.Example5", {
		metadata: {},

		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.openEnd();
				oRm.close("div");
			}
		}
	});
	// TODO detect: Check why this override is currently not detected in JavaScript files.
	// The same code is detected properly in ControlRerenderOverrideTypeScript.ts.
	Example5.prototype.rerender = function() {
		console.log("Overriding rerender method without calling super method");
	};

	function rerender() {
		console.log("Overriding rerender method without calling super method");
	}

	const Example6 = Control.extend("sap.ui.demo.linter.controls.Example6", {
		metadata: {},

		rerender,

		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.openEnd();
				oRm.close("div");
			}
		}
	});

	const Example7 = Control.extend("sap.ui.demo.linter.controls.Example7", {
		metadata: {},

		rerender: rerender,

		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
				oRm.openStart("div", oControl);
				oRm.openEnd();
				oRm.close("div");
			}
		}
	});
});
