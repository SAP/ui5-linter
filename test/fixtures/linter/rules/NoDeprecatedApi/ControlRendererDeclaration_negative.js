sap.ui.define([
	"sap/ui/core/Control", "sap/m/Button", "sap/ui/core/webc/WebComponent",
	"sap/uxap/BlockBase", "./NegativeExample1Renderer"
], function(Control, Button, WebComponent, BlockBase, BaseChart, NegativeExample1Renderer) {

	const NegativeExample1 = Control.extend("sap.ui.demo.linter.controls.NegativeExample1", {
		metadata: {},
		renderer: NegativeExample1Renderer
	});

	const NegativeExample2 = Control.extend("sap.ui.demo.linter.controls.NegativeExample2", {
		metadata: {},
		renderer: null
	});

	const NegativeExample3 = Button.extend("sap.ui.demo.linter.controls.NegativeExample3", {
		metadata: {},
		renderer: undefined
	});

	const NegativeExample4 = Control.extend("sap.ui.demo.linter.controls.NegativeExample4", {
		metadata: {},
		renderer: function(oRm, oControl) {
		}
	});

	const NegativeExample5 = Control.extend("sap.ui.demo.linter.controls.NegativeExample5", {
		metadata: {},
		renderer: (oRm, oControl) => {
		}
	});

	const NegativeExample6 = Control.extend("sap.ui.demo.linter.controls.NegativeExample6", {
		metadata: {},
		renderer(oRm, oControl) {
		}
	});

	const NegativeExample7 = Button.extend("sap.ui.demo.linter.controls.NegativeExample7", {
		metadata: {},
		renderer: {
			apiVersion: 2,
			render: function(oRm, oControl) {
			}
		}
	});

	const NegativeExample8 = Button.extend("sap.ui.demo.linter.controls.NegativeExample8", {
		metadata: {},
		renderer: {
			apiVersion: 4,
			render: function(oRm, oControl) {
			}
		}
	});

	// Special cases:

	const NegativeExample9 = WebComponent.extend("sap.ui.demo.linter.controls.NegativeExample9", {
		metadata: {},
		// No deprecation: Uses sap.ui.core.webc.WebComponentRenderer if no renderer is specified
	});

	const NegativeExample10 = BlockBase.extend("sap.ui.demo.linter.controls.NegativeExample10", {
		metadata: {},
		// No deprecation: Uses sa.uxa.BlockBaseRenderer if no renderer is specified
	});

});
