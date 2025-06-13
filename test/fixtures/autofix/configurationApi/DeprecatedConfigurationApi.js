// This test artifact contains all deprecated configuration API methods which are EASILY migratable
sap.ui.define([
	"sap/ui/core/Configuration",
], (ConfigurationRenamed) => {
	ConfigurationRenamed.getAccessibility();
	ConfigurationRenamed.getActiveTerminologies();
	ConfigurationRenamed.getAllowlistService();
	ConfigurationRenamed.getAnimationMode();
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
});
