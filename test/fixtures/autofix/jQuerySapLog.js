sap.ui.define([], async function () {
	jQuery.sap.log.debug("This is a debug log message");

	sap.ui.require([], function () {
		jQuery.sap.log.debug("This is a debug log message");
		sap.ui.require(["sap/base/Log"], function (Log) {
			jQuery.sap.log.debug("This is a debug log message");
		});
	});

	jQuery.sap.log.error("This is a error log message");
	jQuery.sap.log.fatal("This is a fatal log message");
	jQuery.sap.log.info("This is a info log message");
	jQuery.sap.log.trace("This is a trace log message");
	jQuery.sap.log.warning("This is a warning log message");

	jQuery.sap.log.fatal("This is a fatal log message")
		.error("This is a error log message")
		.info("This is a info log message")
		.trace("This is a trace log message")
		.warning("This is a warning log message");

	const baseLog = jQuery.sap.log.getLogger();
	baseLog.debug("This is a debug log message");
	const level = jQuery.sap.log.getLevel();

	if (level === jQuery.sap.log.LogLevel.DEBUG) {
		jQuery.sap.log.debug(`This is a debug (${jQuery.sap.Level.DEBUG}) log message`);
	}
});
