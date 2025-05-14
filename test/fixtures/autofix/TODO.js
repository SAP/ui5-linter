sap.ui.define(() => {
	// TODO: Multiple non-conflicting migrations within the same line should work
	jQuery.sap.log.debug(jQuery.sap.formatMessage("{0} {1} {2}", ["a", "b", "c"]), "details", "component");

	// TODO: setLevel should be replaced here
	jQuery.sap.log.setLevel(jQuery.sap.log.Level.DEBUG, "mockserver");


	// TODO: In this case we could know that a string is provided, so the fallback to empty string is not needed
	let oResponse;
	if (typeof oResponse === "string" && jQuery.sap.startsWith(oResponse, "something")) {

	}

	// TODO: In this case we could know that a string is provided, so the fallback to empty string is not needed
	const sParam = "'something'";
	if (sParam.length >= 2 && jQuery.sap.startsWith(sParam, "'") && jQuery.sap.endsWith(sParam, "'")) {

	}

	// TODO: The toUpperCase of static strings could be done during autofix
	jQuery.sap.startsWithIgnoreCase(Device.os.name, "win");
});
