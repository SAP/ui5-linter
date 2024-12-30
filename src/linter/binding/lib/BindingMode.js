/*
 * This is a copy of the sap/ui/model/BindingMode.js module of the OpenUI5 project
 * https://github.com/SAP/openui5/blob/a4507f0d4f8a56cc881e8983479c8f9b21bfb96b/src/sap.ui.core/src/sap/ui/model/BindingMode.js
 */

/**
* Binding type definitions.
*
* @enum {string}
* @public
* @alias sap.ui.model.BindingMode
*/
var BindingMode = {

	/**
	 * BindingMode default means that the binding mode of the model is used
	 * @public
	 */
	Default: "Default",

	/**
	 * BindingMode one time means value is only read from the model once
	 * @public
	 */
	OneTime: "OneTime",

	/**
	 * BindingMode one way means from model to view
	 * @public
	 */
	OneWay: "OneWay",

	/**
	 * BindingMode two way means from model to view and vice versa
	 * @public
	 */
	TwoWay: "TwoWay",

};

export default BindingMode;
