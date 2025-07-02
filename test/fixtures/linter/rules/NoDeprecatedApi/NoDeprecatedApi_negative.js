const { default: Button } = require("sap/m/Button");

sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"sap/m/library",
	"sap/ui/test/matchers/Ancestor",
	"sap/m/Button"
], function(jQuery, mobileLib, Ancestor, Button) {
	jQuery(document).on("touchstart mousedown", function() { // OK: Deprecated jQuery functions should not be checked
		console.log("Hello World!");
	});

	mobileLib.InputType.Text;

	// Matchers are classes but return a function instead of an instance.
	// This is a special case w.r.t. AST nodes, so it should be covered.
	// There is no deprecated API usage in the following line.
	const button = new Button({id: "my-button", text: "Click Me!"});
	new Ancestor("my-button")(button);
});
