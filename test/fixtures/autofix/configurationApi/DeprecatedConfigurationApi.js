sap.ui.define([
	"sap/ui/core/Configuration",
], (ConfigurationRenamed) => {
	ConfigurationRenamed.getAccessibility();
	ConfigurationRenamed.getActiveTerminologies();
	ConfigurationRenamed.getAllowlistService();
	ConfigurationRenamed.getAnimation();
	const a = ConfigurationRenamed.getAnimation(); // Do not migrate since return value differs
	ConfigurationRenamed.getAnimationMode();
	// Although the return type of the replacement is different,
	// getAnimationMode() is still migratable since old and new return types are congruent:
	if (ConfigurationRenamed.getAnimationMode() === ConfigurationRenamed.AnimationMode.minimal) {

	}
	ConfigurationRenamed.getCalendarType();
	ConfigurationRenamed.getCalendarWeekNumbering();
	ConfigurationRenamed.getFrameOptions();
	ConfigurationRenamed.getLanguage();
	ConfigurationRenamed.getRTL();
	ConfigurationRenamed.getSAPLogonLanguage();
	ConfigurationRenamed.getSecurityTokenHandlers();
	ConfigurationRenamed.getTheme();
	ConfigurationRenamed.getTimezone();
	ConfigurationRenamed.getUIDPrefix();
	ConfigurationRenamed.getWhitelistService();
	ConfigurationRenamed.setAnimationMode(ConfigurationRenamed.AnimationMode.minimal);
	ConfigurationRenamed.setSecurityTokenHandlers([() => {console.log("*Security token handler*");}]);
	ConfigurationRenamed.getLanguageTag();
	ConfigurationRenamed.getFormatLocale();

	// Migration to two new modules
	ConfigurationRenamed.getLocale();

	// Complex migrations
	ConfigurationRenamed.setCalendarType(sCalendarType);
	ConfigurationRenamed.setCalendarWeekNumbering(sCalendarWeekNumbering);
	ConfigurationRenamed.setFormatLocale(sFormatLocale);
	ConfigurationRenamed.setLanguage(sLanguage, sSAPLogonLanguage);
	ConfigurationRenamed.setLanguage(sLanguage);
	ConfigurationRenamed.setRTL(bRTL);
	ConfigurationRenamed.setTheme(sTheme);
	ConfigurationRenamed.setTimezone(sTimezone);

	// Do not migrate these methods, as they used to return "this" and now return "undefined".
	// Further more, now the functionality is moved into multiple modules.
	ConfigurationRenamed.setRTL(false).setLanguage("en");
	const setCalendar = (type) => ConfigurationRenamed.setCalendarType(type);
	const typedCalendar = sType ? ConfigurationRenamed.setCalendarType(sType) : null;
	debug("msg 2", ConfigurationRenamed.setFormatLocale(sFormatLocale));
	debug("msg 2", (ConfigurationRenamed.setFormatLocale(sFormatLocale)));
	debug("msg 2", ((((ConfigurationRenamed.setFormatLocale(sFormatLocale))))));
	var time = ConfigurationRenamed.setTimezone(sTimezone);
	var info = {
		theme: ConfigurationRenamed.setTheme(sTheme)
	};
	ConfigurationRenamed.setTheme(sTheme) ?? ConfigurationRenamed.setTimezone(sTimezone);
	ConfigurationRenamed.setCalendarWeekNumbering(sCalendarWeekNumbering) ? "a" : "b";
	ConfigurationRenamed.setCalendarType(sCalendarType), ConfigurationRenamed.setCalendarWeekNumbering(sCalendarWeekNumbering);
	fnCall(ConfigurationRenamed.setLanguage(sLanguage));
});
