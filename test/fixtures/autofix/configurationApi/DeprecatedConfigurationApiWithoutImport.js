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

	globalConfiguration.getAnimation();
	sap.ui.getCore().getConfiguration().getAnimation();
	const a = globalConfiguration.getAnimation() // Do not migrate since return value differs

	globalConfiguration.getAnimationMode();
	sap.ui.getCore().getConfiguration().getAnimationMode();
	// Although the return type of the replacement is different,
	// getAnimationMode() is still migratable since old and new return types are congruent:
	if (globalConfiguration.getAnimationMode() === globalConfiguration.AnimationMode.minimal) {

	}

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

	// Migration to two new modules
	globalConfiguration.getLocale();
	sap.ui.getCore().getConfiguration().getLocale();

	// Complex migrations
	sap.ui.getCore().getConfiguration().setCalendarType(sCalendarType);
	globalConfiguration.setCalendarType(sCalendarType);
	sap.ui.getCore().getConfiguration().setCalendarWeekNumbering(sCalendarWeekNumbering);
	globalConfiguration.setCalendarWeekNumbering(sCalendarWeekNumbering);
	sap.ui.getCore().getConfiguration().setFormatLocale(sFormatLocale);
	globalConfiguration.setFormatLocale(sFormatLocale);
	sap.ui.getCore().getConfiguration().setLanguage(sLanguage);
	globalConfiguration.setLanguage(sLanguage, sSAPLogonLanguage);
	sap.ui.getCore().getConfiguration().setRTL(bRTL);
	globalConfiguration.setRTL(bRTL);
	sap.ui.getCore().getConfiguration().setTheme(sTheme);
	globalConfiguration.setTheme(sTheme);
	sap.ui.getCore().getConfiguration().setTimezone(sTimezone);
	globalConfiguration.setTimezone(sTimezone);

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
