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
	
	
	sap.ui.getCore().getConfiguration().setCalendarType(sCalendarType);
	sap.ui.getCore().getConfiguration().setCalendarWeekNumbering(sCalendarWeekNumbering);
	sap.ui.getCore().getConfiguration().setFormatLocale(sFormatLocale);
	globalConfiguration.setLanguage(sLanguage, sSAPLogonLanguage);
	sap.ui.getCore().getConfiguration().setLanguage(sLanguage);
	sap.ui.getCore().getConfiguration().setRTL(bRTL);
	globalConfiguration.setTheme(sTheme);
	sap.ui.getCore().getConfiguration().setTimezone(sTimezone);
	
	// Do not migrate these methods, as they used to return "this" and now return "undefined".
	// Further more, now the functionality is moved into multiple modules.
	sap.ui.getCore().getConfiguration().setRTL(false).setLanguage("en");
	const setCalendar = (type) => sap.ui.getCore().getConfiguration().setCalendarType(type);
	const typedCalendar = sType ? sap.ui.getCore().getConfiguration().setCalendarType(sType) : null;
	debug("msg 2", sap.ui.getCore().getConfiguration().setFormatLocale(sFormatLocale));
	debug("msg 2", (globalConfiguration.setFormatLocale(sFormatLocale)));
	debug("msg 2", ((((sap.ui.getCore().getConfiguration().setFormatLocale(sFormatLocale))))));
	var time = sap.ui.getCore().getConfiguration().setTimezone(sTimezone);
	var info = {
		theme: globalConfiguration.setTheme(sTheme)
	};
	globalConfiguration.setTheme(sTheme) ?? sap.ui.getCore().getConfiguration().setTimezone(sTimezone);
	sap.ui.getCore().getConfiguration().setCalendarWeekNumbering(sCalendarWeekNumbering) ? "a" : "b";
	globalConfiguration.setCalendarType(sCalendarType), sap.ui.getCore().getConfiguration().setCalendarWeekNumbering(sCalendarWeekNumbering);
	fnCall(sap.ui.getCore().getConfiguration().setLanguage(sLanguage));
});
