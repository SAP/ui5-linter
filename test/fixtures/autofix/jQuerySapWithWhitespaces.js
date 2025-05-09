sap.ui.define([], function () {

	// Line breaks between arguments
	jQuery.sap.assert(
		false,
		"That's an assert"
	);

	// Line breaks between property access
	const logObject = jQuery.
	sap.
	log;

	// Line breaks between property access and call
	const myLogger = jQuery.
	sap.
	log.
	getLogger();

	// Spaces between property access, call, and arguments
	jQuery . sap . log . error ( "error" ) ;
});
