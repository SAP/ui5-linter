// Fixture description:
// TypeScript component which does not implement IAsyncContentCreation interface, no async flags in manifest.json
// Also, usage of deprecated type in properties should be reported
import UIComponent from "sap/ui/core/UIComponent";

export default class Component extends UIComponent {
	constructor() {
		super("my.comp.Component");
	}

	static metadata = {
		"properties": {
			// Usage of deprecated type
			propertyWithDeprecatedType: {
				type: "sap.m.DateTimeInputType"
			},
		}
	};
}
