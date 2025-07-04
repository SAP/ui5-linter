/*global QUnit */
sap.ui.define([
	"sap/ui/core/Configuration",
	"sap/ui/core/CalendarType",
	"sap/ui/core/date/CalendarWeekNumbering",
], (Configuration, CalendarType, CalendarWeekNumbering) => {
	"use strict";

	const globalConfiguration = sap.ui.getCore().getConfiguration();

	QUnit.module("Configuration");

	QUnit.test("getAccessibility", function (assert) {
		assert.strictEqual(typeof Configuration.getAccessibility(), "boolean", "The result from getAccessibility() is a boolean");
		assert.strictEqual(typeof globalConfiguration.getAccessibility(), "boolean", "The result from getAccessibility() is a boolean");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getAccessibility(), "boolean", "The result from getAccessibility() is a boolean");
	});

	QUnit.test("getActiveTerminologies", function (assert) {
		assert.ok(Array.isArray(Configuration.getActiveTerminologies()) || Configuration.getActiveTerminologies() === undefined, "Type is string[]|undefined");
		assert.ok(Array.isArray(globalConfiguration.getActiveTerminologies()) || globalConfiguration.getActiveTerminologies() === undefined, "Type is string[]|undefined");
		assert.ok(Array.isArray(sap.ui.getCore().getConfiguration().getActiveTerminologies()) || sap.ui.getCore().getConfiguration().getActiveTerminologies() === undefined, "Type is string[]|undefined");
	});

	QUnit.test("getAllowlistService", function (assert) {
		assert.strictEqual(typeof Configuration.getAllowlistService(), "string", "The result from getAllowlistService() is a string");
		assert.strictEqual(typeof globalConfiguration.getAllowlistService(), "string", "The result from getAllowlistService() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getAllowlistService(), "string", "The result from getAllowlistService() is a string");
	});

	QUnit.test("getAnimation", function (assert) {
		const a = Configuration.getAnimation(); // Will not be migrated since the return value is used
		assert.strictEqual(typeof a, "boolean", "The result from getAnimation() is a boolean");
		const a2 = globalConfiguration.getAnimation(); // Will not be migrated since the return value is used
		assert.strictEqual(typeof a2, "boolean", "The result from getAnimation() is a boolean");
		const a3 = sap.ui.getCore().getConfiguration().getAnimation(); // Will not be migrated since the return value is used
		assert.strictEqual(typeof a3, "boolean", "The result from getAnimation() is a boolean");
	});

	QUnit.test("getAnimationMode", function (assert) {
		const list = Configuration.AnimationMode; // Old and new return types are congruent, so this is migratable
		assert.ok(list[Configuration.getAnimationMode()], "The result from getAnimationMode() is an AnimationMode instance");
		assert.ok(list[globalConfiguration.getAnimationMode()], "The result from getAnimationMode() is an AnimationMode instance");
		assert.ok(list[sap.ui.getCore().getConfiguration().getAnimationMode()], "The result from getAnimationMode() is an AnimationMode instance");
	});

	QUnit.test("getCalendarType", function (assert) {
		const list = CalendarType;
		assert.ok(list[Configuration.getCalendarType()], "The result from getCalendarType() is a CalendarType instance");
		assert.ok(list[globalConfiguration.getCalendarType()], "The result from getCalendarType() is a CalendarType instance");
		assert.ok(list[sap.ui.getCore().getConfiguration().getCalendarType()], "The result from getCalendarType() is a CalendarType instance");
	});

	QUnit.test("getCalendarWeekNumbering", function (assert) {
		const list = CalendarWeekNumbering;
		assert.ok(list[Configuration.getCalendarWeekNumbering()], "The result from getCalendarWeekNumbering() is a CalendarWeekNumbering instance");
		assert.ok(list[globalConfiguration.getCalendarWeekNumbering()], "The result from getCalendarWeekNumbering() is a CalendarWeekNumbering instance");
		assert.ok(list[sap.ui.getCore().getConfiguration().getCalendarWeekNumbering()], "The result from getCalendarWeekNumbering() is a CalendarWeekNumbering instance");
	});

	QUnit.test("getFrameOptions", function (assert) {
		assert.strictEqual(typeof Configuration.getFrameOptions(), "string", "The result from getFrameOptions() is a string");
		assert.strictEqual(typeof globalConfiguration.getFrameOptions(), "string", "The result from getFrameOptions() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getFrameOptions(), "string", "The result from getFrameOptions() is a string");
	});

	QUnit.test("getFormatLocale", function (assert) {
		assert.strictEqual(typeof Configuration.getFormatLocale(), "string", "The result from getFormatLocale() is a string");
		assert.strictEqual(typeof globalConfiguration.getFormatLocale(), "string", "The result from getFormatLocale() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getFormatLocale(), "string", "The result from getFormatLocale() is a string");
	});

	QUnit.test("getLanguage", function (assert) {
		assert.strictEqual(typeof Configuration.getLanguage(), "string", "The result from getLanguage() is a string");
		assert.strictEqual(typeof globalConfiguration.getLanguage(), "string", "The result from getLanguage() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getLanguage(), "string", "The result from getLanguage() is a string");
	});

	QUnit.test("getLanguageTag", function (assert) {
		assert.strictEqual(typeof Configuration.getLanguageTag(), "string", "The result from getLanguageTag() is a string");
		assert.strictEqual(typeof globalConfiguration.getLanguageTag(), "string", "The result from getLanguageTag() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getLanguageTag(), "string", "The result from getLanguageTag() is a string");
	});

	QUnit.test("getLocale", function (assert) {
		assert.ok(Configuration.getLocale() instanceof sap.ui.core.Locale, "The result from getLocale() is of type sap.ui.core.Locale");
		assert.ok(globalConfiguration.getLocale() instanceof sap.ui.core.Locale, "The result from getLocale() is of type sap.ui.core.Locale");
		assert.ok(sap.ui.getCore().getConfiguration().getLocale() instanceof sap.ui.core.Locale, "The result from getLocale() is of type sap.ui.core.Locale");
	});

	QUnit.test("getRTL", function (assert) {
		assert.strictEqual(typeof Configuration.getRTL(), "boolean", "The result from getRTL() is a boolean");
		assert.strictEqual(typeof globalConfiguration.getRTL(), "boolean", "The result from getRTL() is a boolean");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getRTL(), "boolean", "The result from getRTL() is a boolean");
	});

	QUnit.test("getSAPLogonLanguage", function (assert) {
		assert.strictEqual(typeof Configuration.getSAPLogonLanguage(), "string", "The result from getSAPLogonLanguage() is a string");
		assert.strictEqual(typeof globalConfiguration.getSAPLogonLanguage(), "string", "The result from getSAPLogonLanguage() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getSAPLogonLanguage(), "string", "The result from getSAPLogonLanguage() is a string");
	});

	QUnit.test("getSecurityTokenHandlers", function (assert) {
		assert.ok(Array.isArray(Configuration.getSecurityTokenHandlers()), "The result from getSecurityTokenHandlers() is an Array");
		assert.ok(Array.isArray(globalConfiguration.getSecurityTokenHandlers()), "The result from getSecurityTokenHandlers() is an Array");
		assert.ok(Array.isArray(sap.ui.getCore().getConfiguration().getSecurityTokenHandlers()), "The result from getSecurityTokenHandlers() is an Array");
	});

	QUnit.test("getTheme", function (assert) {
		assert.strictEqual(typeof Configuration.getTheme(), "string", "The result from getTheme() is a string");
		assert.strictEqual(typeof globalConfiguration.getTheme(), "string", "The result from getTheme() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getTheme(), "string", "The result from getTheme() is a string");
	});

	QUnit.test("getTimezone", function (assert) {
		assert.strictEqual(typeof Configuration.getTimezone(), "string", "The result from getTimezone() is a string");
		assert.strictEqual(typeof globalConfiguration.getTimezone(), "string", "The result from getTimezone() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getTimezone(), "string", "The result from getTimezone() is a string");
	});

	QUnit.test("getUIDPrefix", function (assert) {
		assert.strictEqual(typeof Configuration.getUIDPrefix(), "string", "The result from getUIDPrefix() is a string");
		assert.strictEqual(typeof globalConfiguration.getUIDPrefix(), "string", "The result from getUIDPrefix() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getUIDPrefix(), "string", "The result from getUIDPrefix() is a string");
	});

	QUnit.test("getWhitelistService", function (assert) {
		assert.strictEqual(typeof Configuration.getWhitelistService(), "string", "The result from getWhitelistService() is a string");
		assert.strictEqual(typeof globalConfiguration.getWhitelistService(), "string", "The result from getWhitelistService() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getWhitelistService(), "string", "The result from getWhitelistService() is a string");
	});

	QUnit.test("setAnimationMode", function (assert) {
		Configuration.setAnimationMode(Configuration.AnimationMode.minimal);
		assert.strictEqual(globalConfiguration.getAnimationMode(), Configuration.AnimationMode.minimal, "The animation mode is set to minimal");

		globalConfiguration.setAnimationMode(globalConfiguration.AnimationMode.full);
		assert.strictEqual(Configuration.getAnimationMode(), Configuration.AnimationMode.full, "The animation mode is set to full");

		sap.ui.getCore().getConfiguration().setAnimationMode(sap.ui.getCore().getConfiguration().AnimationMode.none);
		assert.strictEqual(Configuration.getAnimationMode(), globalConfiguration.AnimationMode.none, "The animation mode is set to none");
	});

	QUnit.test("setCalendarType", function (assert) {
		Configuration.setCalendarType(CalendarType.Gregorian);
		assert.strictEqual(globalConfiguration.getCalendarType(), CalendarType.Gregorian, "The calendar type is set to Gregorian");
		globalConfiguration.setCalendarType(CalendarType.Japanese);
		assert.strictEqual(Configuration.getCalendarType(), CalendarType.Japanese, "The calendar type is set to Japanese");
		sap.ui.getCore().getConfiguration().setCalendarType(CalendarType.Islamic);
		assert.strictEqual(globalConfiguration.getCalendarType(), CalendarType.Islamic, "The calendar type is set to Islamic");
	});

	QUnit.test("setCalendarWeekNumbering", function (assert) {
		Configuration.setCalendarWeekNumbering(CalendarWeekNumbering.ISO_8601);
		assert.strictEqual(globalConfiguration.getCalendarWeekNumbering(), CalendarWeekNumbering.ISO_8601, "The calendar week numbering is set to ISO_8601");
		globalConfiguration.setCalendarWeekNumbering(CalendarWeekNumbering.MiddleEastern);
		assert.strictEqual(Configuration.getCalendarWeekNumbering(), CalendarWeekNumbering.MiddleEastern, "The calendar week numbering is set to MiddleEastern");
		sap.ui.getCore().getConfiguration().setCalendarWeekNumbering(CalendarWeekNumbering.WesternTraditional);
		assert.strictEqual(globalConfiguration.getCalendarWeekNumbering(), CalendarWeekNumbering.WesternTraditional, "The calendar week numbering is set to WesternTraditional");
	});

	QUnit.test("setFormatLocale", function (assert) {
		Configuration.setFormatLocale("en-US");
		assert.strictEqual(globalConfiguration.getFormatLocale(), "en-US", "The format locale is set correctly");

		globalConfiguration.setFormatLocale("de-DE");
		assert.strictEqual(Configuration.getFormatLocale(), "de-DE", "The format locale is set correctly");

		sap.ui.getCore().getConfiguration().setFormatLocale("fr-FR");
		assert.strictEqual(globalConfiguration.getFormatLocale(), "fr-FR", "The format locale is set correctly");
	});

	QUnit.test("setLanguage", function (assert) {
		Configuration.setLanguage("en-US");
		assert.strictEqual(globalConfiguration.getLanguage(), "en-US", "The language is set to English");

		globalConfiguration.setLanguage("de-DE");
		assert.strictEqual(Configuration.getLanguage(), "de-DE", "The language is set to German");

		sap.ui.getCore().getConfiguration().setLanguage("fr-FR");
		assert.strictEqual(globalConfiguration.getLanguage(), "fr-FR", "The language is set to French");
	});

	QUnit.test("setRTL", function (assert) {
		Configuration.setRTL(false);
		assert.strictEqual(globalConfiguration.getRTL(), false, "The RTL setting is set to true");

		globalConfiguration.setRTL(true);
		assert.strictEqual(Configuration.getRTL(), true, "The RTL setting is set to false");

		sap.ui.getCore().getConfiguration().setRTL(false);
		assert.strictEqual(globalConfiguration.getRTL(), false, "The RTL setting is set to true");
	});

	QUnit.test("setSecurityTokenHandlers", function (assert) {
		const handler1 = [() => new Promise((resolve) => { resolve("*Security token handler 1*"); })];
		const handler2 = [() => new Promise((resolve) => { resolve("*Security token handler 2*"); })];
		const handler3 = [() => new Promise((resolve) => { resolve("*Security token handler 3*"); })];

		Configuration.setSecurityTokenHandlers(handler1);
		assert.deepEqual(globalConfiguration.getSecurityTokenHandlers(), handler1, "Security token handlers are set correctly");

		globalConfiguration.setSecurityTokenHandlers(handler2);
		assert.deepEqual(Configuration.getSecurityTokenHandlers(), handler2, "Security token handlers are set correctly");

		sap.ui.getCore().getConfiguration().setSecurityTokenHandlers(handler3);
		assert.deepEqual(Configuration.getSecurityTokenHandlers(), handler3, "Security token handlers are set correctly");
	});

	QUnit.test("setTheme", function (assert) {
		Configuration.setTheme("sap_fiori_3");
		assert.strictEqual(globalConfiguration.getTheme(), "sap_fiori_3", "The theme is set to sap_fiori_3");

		globalConfiguration.setTheme("sap_belize");
		assert.strictEqual(Configuration.getTheme(), "sap_belize", "The theme is set to sap_belize");

		sap.ui.getCore().getConfiguration().setTheme("sap_horizon");
		assert.strictEqual(globalConfiguration.getTheme(), "sap_horizon", "The theme is set to sap_horizon");
	});

	QUnit.test("setTimezone", function (assert) {
		Configuration.setTimezone("Europe/Berlin");
		assert.strictEqual(globalConfiguration.getTimezone(), "Europe/Berlin", "The timezone is set to Europe/Berlin");

		globalConfiguration.setTimezone("America/New_York");
		assert.strictEqual(Configuration.getTimezone(), "America/New_York", "The timezone is set to America/New_York");

		sap.ui.getCore().getConfiguration().setTimezone("Asia/Tokyo");
		assert.strictEqual(globalConfiguration.getTimezone(), "Asia/Tokyo", "The timezone is set to Asia/Tokyo");
	});

});
