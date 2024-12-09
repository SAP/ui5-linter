// This project is used to test the linter with the namespace of an OpenUI5 project.

sap.ui.require([
	"sap/f/Avatar",
	"sap/m/DateTimeInput",
	"sap/f/ProductSwitchRenderer",
	"sap/f/NewControl"
], (Avatar, DateTimeInput, ProductSwitchRenderer, NewControl) => {
	new Avatar();
	new DateTimeInput();

	Avatar.extend("CustomControl", {
		// Usage of render function without object is deprecated as no apiVersion is defined
		renderer: ProductSwitchRenderer.render
	});

	// This ensures that the renderer declaration is also checked for controls based on
	// controls of a framework library for which no @sapui5/types exist (sap/f/NewControl).
	const CustomNewControl = NewControl.extend("CustomNewControl");
});
