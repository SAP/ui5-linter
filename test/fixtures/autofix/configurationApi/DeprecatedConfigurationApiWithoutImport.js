// This test artifact contains all deprecated configuration API methods which are EASILY migratable
// without import (only use of globals)
sap.ui.define([], () => {
	const globalConfiguration = sap.ui.getCore().getConfiguration();

	globalConfiguration.getAccessibility();
	sap.ui.getCore().getConfiguration().getAccessibility();

	globalConfiguration.getActiveTerminologies();
	sap.ui.getCore().getConfiguration().getActiveTerminologies();

	globalConfiguration.getAllowlistService();
	sap.ui.getCore().getConfiguration().getAllowlistService();

	globalConfiguration.getAnimationMode();
	sap.ui.getCore().getConfiguration().getAnimationMode();

	globalConfiguration.getCalendarType();
	sap.ui.getCore().getConfiguration().getCalendarType();

	globalConfiguration.getCalendarWeekNumbering();
	sap.ui.getCore().getConfiguration().getCalendarWeekNumbering();

	globalConfiguration.getFrameOptions();
	sap.ui.getCore().getConfiguration().getFrameOptions();

	globalConfiguration.getLanguage();
	sap.ui.getCore().getConfiguration().getLanguage();

	globalConfiguration.getRTL();
	sap.ui.getCore().getConfiguration().getRTL();

	globalConfiguration.getSAPLogonLanguage();
	sap.ui.getCore().getConfiguration().getSAPLogonLanguage();

	globalConfiguration.getSecurityTokenHandlers();
	sap.ui.getCore().getConfiguration().getSecurityTokenHandlers();

	globalConfiguration.getTheme();
	sap.ui.getCore().getConfiguration().getTheme();

	globalConfiguration.getTimezone();
	sap.ui.getCore().getConfiguration().getTimezone();

	globalConfiguration.getUIDPrefix();
	sap.ui.getCore().getConfiguration().getUIDPrefix();

	globalConfiguration.getWhitelistService();
	sap.ui.getCore().getConfiguration().getWhitelistService();

	globalConfiguration.setAnimationMode(globalConfiguration.AnimationMode.minimal);
	sap.ui.getCore().getConfiguration().setAnimationMode(sap.ui.getCore().getConfiguration().AnimationMode.minimal);

	globalConfiguration.setSecurityTokenHandlers([() => {console.log("*Security token handler*");}]);
	sap.ui.getCore().getConfiguration().setSecurityTokenHandlers([() => {console.log("*Security token handler*");}]);

	globalConfiguration.getLanguageTag();
	sap.ui.getCore().getConfiguration().getLanguageTag();

	globalConfiguration.getFormatLocale();
	sap.ui.getCore().getConfiguration().getFormatLocale();
});
