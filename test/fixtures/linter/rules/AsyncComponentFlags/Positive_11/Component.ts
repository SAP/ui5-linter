// Fixture description:
// TypeScript component which does not implement IAsyncContentCreation interface, no async flags in manifest.json
import UIComponent from "sap/ui/core/UIComponent";

export default class Component extends UIComponent {
	constructor() {
		super("my.comp.Component");
	}
}
