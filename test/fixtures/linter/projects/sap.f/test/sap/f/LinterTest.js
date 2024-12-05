// This project is used to test the linter with the namespace of an OpenUI5 project.

sap.ui.require([
	"sap/f/Avatar",
	"sap/m/DateTimeInput",
	"sap/f/ProductSwitchRenderer"
], (Avatar, DateTimeInput, ProductSwitchRenderer) => {
	new Avatar();
	new DateTimeInput();

	Avatar.extend("CustomControl", {
		// Usage of render function without object is deprecated as no apiVersion is defined
		// TODO detect: This is currently not detected as the module resolution is not working correctly.
		// This needs to be solved in a separate change.
		renderer: ProductSwitchRenderer.render
	});
});
