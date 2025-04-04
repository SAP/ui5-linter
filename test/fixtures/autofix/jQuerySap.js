sap.ui.define([], function () {
	// https://github.com/SAP/ui5-linter/issues/520
	jQuery.sap.assert(false, "That's an assert");

	// https://github.com/SAP/ui5-linter/issues/521
	const bundle = jQuery.sap.resources({
		url: "resources/i18n.properties"
	});

	// https://github.com/SAP/ui5-linter/issues/522
	const logObject = jQuery.sap.log;
	const myLogger = jQuery.sap.log.getLogger();
	const myLog = jQuery.sap.log.getLog();
	const myLog2 = jQuery.sap.log.getLogEntries();
	const oLogListener = {};
	oLogListener.onLogEntry = function(oLog) {
	//
	};
	jQuery.sap.log.addLogListener(oLogListener);
	jQuery.sap.log.removeLogListener(oLogListener);
	const level =  jQuery.sap.log.getLevel();
	const logLevel = jQuery.sap.log.Level;
	const isLoggable = jQuery.sap.log.isLoggable(logLevel.DEBUG);
	jQuery.sap.log.logSupportInfo(true);
	jQuery.sap.log.debug("This is a debug log message");
	jQuery.sap.log.error("This is a error log message");
	jQuery.sap.log.fatal("This is a fatal log message");
	jQuery.sap.log.info("This is a info log message");
	jQuery.sap.log.trace("This is a trace log message");
	jQuery.sap.log.warning("This is a warning log message");
});
