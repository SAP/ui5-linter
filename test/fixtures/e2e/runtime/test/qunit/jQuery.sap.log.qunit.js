/*global QUnit */
sap.ui.define(() => {
	"use strict";

	QUnit.module("jQuery.sap.log");

	QUnit.test("Debug", function (assert) {
		var aLog1 = jQuery.sap.log.getLogEntries();
		var iLogCount1 = aLog1.length;

		// log one message
		var myLogMessage = "This is a debug message";
		var myDetails = "These are the details";
		var myComponent = "jquery.sap.logger.jsunit";
		jQuery.sap.log.debug(myLogMessage, myDetails, myComponent);
		var aLog2 = jQuery.sap.log.getLogEntries();
		var iLogCount2 = aLog2.length;
		var oMyLogEntry = aLog2[aLog2.length - 1];

		// compare results
		assert.strictEqual(iLogCount2, iLogCount1 + 1, "number of log entries should have been inceased by one");
		assert.strictEqual(oMyLogEntry.message, myLogMessage, "log message is wrong");
		assert.strictEqual(oMyLogEntry.details, myDetails, "log details are wrong");
		assert.strictEqual(oMyLogEntry.component, myComponent, "log component is wrong");
		assert.strictEqual(oMyLogEntry.level, jQuery.sap.log.Level.DEBUG, "log level is wrong");
	});
});
