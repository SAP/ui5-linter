/*
 * This is a copy of the sap/ui/core/mvc/EventHandlerResolver.js module from OpenUI5.
 * https://github.com/SAP/openui5/blob/83fd99ee17fddff1616577b9acaa1e0cc0ed412a/src/sap.ui.core/src/sap/ui/core/mvc/EventHandlerResolver.js
 *
 * It only contains the "parse" function, as all other functionality is not needed.
 */

/* eslint-disable */
/* eslint-enable no-undef */

import JSTokenizer from "./JSTokenizer.js";

// Provides module sap.ui.core.mvc.EventHandlerResolver.
// sap.ui.define([
// 	"sap/ui/base/BindingParser",
// 	"sap/ui/core/CommandExecution",
// 	"sap/ui/model/BindingMode",
// 	"sap/ui/model/CompositeBinding",
// 	"sap/ui/model/json/JSONModel",
// 	"sap/ui/model/base/ManagedObjectModel",
// 	"sap/base/util/JSTokenizer",
// 	"sap/base/util/resolveReference",
// 	"sap/base/future",
// 	"sap/ui/base/DesignTime"
// ],
// 	function(
// 		BindingParser,
// 		CommandExecution,
// 		BindingMode,
// 		CompositeBinding,
// 		JSONModel,
// 		MOM,
// 		JSTokenizer,
// 		resolveReference,
// 		future,
// 		DesignTime
// 	) {
// 		"use strict";

		var EventHandlerResolver = {

			/**
			 * Parses and splits the incoming string into meaningful event handler definitions
			 *
			 * Examples:
			 *
			 * parse(".fnControllerMethod")
			 * => [".fnControllerMethod"]
			 *
			 * parse(".doSomething('Hello World'); .doSomething2('string'); globalFunction")
			 * => [".doSomething('Hello World')", ".doSomething2('string')", "globalFunction"]

			 * parse(".fnControllerMethod; .fnControllerMethod(${  path:'/someModelProperty', formatter: '.myFormatter', type: 'sap.ui.model.type.String'}    ); globalFunction")
			 * => [".fnControllerMethod", ".fnControllerMethod(${  path:'/someModelProperty', formatter: '.myFormatter', type: 'sap.ui.model.type.String'}    )", "globalFunction"]
			 *
			 * @param {string} [sValue] - Incoming string
			 * @return {string[]} - Array of event handler definitions
			 */
			parse: function parse(sValue) {
				sValue = sValue.trim();
				var oTokenizer = new JSTokenizer();
				var aResult = [];
				var sBuffer = "";
				var iParenthesesCounter = 0;

				oTokenizer.init(sValue, 0);
				for (;;) {
					var sSymbol = oTokenizer.next();
					if ( sSymbol === '"' || sSymbol === "'" ) {
						var pos = oTokenizer.getIndex();
						oTokenizer.string();
						sBuffer += sValue.slice(pos, oTokenizer.getIndex());
						sSymbol = oTokenizer.getCh();
					}
					if ( !sSymbol ) {
						break;
					}
					switch (sSymbol) {
						case "(":
							iParenthesesCounter++;
							break;
						case ")":
							iParenthesesCounter--;
							break;
						default:
							break;
					}

					if (sSymbol === ";" && iParenthesesCounter === 0) {
						aResult.push(sBuffer.trim());
						sBuffer = "";
					} else {
						sBuffer += sSymbol;
					}
				}

				if (sBuffer) {
					aResult.push(sBuffer.trim());
				}

				return aResult;
			}
		};

// 		return EventHandlerResolver;
// 	}
// );

export default EventHandlerResolver;
