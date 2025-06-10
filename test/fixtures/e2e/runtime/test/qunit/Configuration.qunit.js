/*global QUnit */
sap.ui.define([
	"sap/ui/core/Configuration",
	"sap/ui/core/CalendarType",
	"sap/ui/core/date/CalendarWeekNumbering",
], (Configuration, CalendarType, CalendarWeekNumbering) => {
	"use strict";

	var globalConfiguration = sap.ui.getCore().getConfiguration();

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
	
	QUnit.test("getCalendarType", function (assert) {
		assert.ok(Configuration.getCalendarType() instanceof CalendarType, "The result from getCalendarType() is a CalendarType instance");
		assert.ok(globalConfiguration.getCalendarType() instanceof CalendarType, "The result from getCalendarType() is a CalendarType instance");
		assert.ok(sap.ui.getCore().getConfiguration().getCalendarType() instanceof CalendarType, "The result from getCalendarType() is a CalendarType instance");
	});
	
	QUnit.test("getCalendarWeekNumbering", function (assert) {
		assert.ok(Configuration.getCalendarWeekNumbering() instanceof CalendarWeekNumbering, "The result from getCalendarWeekNumbering() is a CalendarWeekNumbering instance");
		assert.ok(globalConfiguration.getCalendarWeekNumbering() instanceof CalendarWeekNumbering, "The result from getCalendarWeekNumbering() is a CalendarWeekNumbering instance");
		assert.ok(sap.ui.getCore().getConfiguration().getCalendarWeekNumbering() instanceof CalendarWeekNumbering, "The result from getCalendarWeekNumbering() is a CalendarWeekNumbering instance");
	});
	
	QUnit.test("getFrameOptions", function (assert) {
		assert.strictEqual(typeof Configuration.getFrameOptions(), "string", "The result from getFrameOptions() is a string");
		assert.strictEqual(typeof globalConfiguration.getFrameOptions(), "string", "The result from getFrameOptions() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getFrameOptions(), "string", "The result from getFrameOptions() is a string");
	});
	
	QUnit.test("getLanguage", function (assert) {
		assert.strictEqual(typeof Configuration.getLanguage(), "string", "The result from getLanguage() is a string");
		assert.strictEqual(typeof globalConfiguration.getLanguage(), "string", "The result from getLanguage() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getLanguage(), "string", "The result from getLanguage() is a string");
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
	
	QUnit.test("getLanguageTag", function (assert) {
		assert.strictEqual(typeof Configuration.getLanguageTag(), "string", "The result from getLanguageTag() is a string");
		assert.strictEqual(typeof globalConfiguration.getLanguageTag(), "string", "The result from getLanguageTag() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getLanguageTag(), "string", "The result from getLanguageTag() is a string");
	});
	
	QUnit.test("getFormatLocale", function (assert) {
		assert.strictEqual(typeof Configuration.getFormatLocale(), "string", "The result from getFormatLocale() is a string");
		assert.strictEqual(typeof globalConfiguration.getFormatLocale(), "string", "The result from getFormatLocale() is a string");
		assert.strictEqual(typeof sap.ui.getCore().getConfiguration().getFormatLocale(), "string", "The result from getFormatLocale() is a string");
	});

	QUnit.test("AnimationMode", function (assert) {
		assert.ok(Configuration.getAnimationMode() instanceof Configuration.AnimationMode, "The result from getAnimationMode() is an AnimationMode instance");
		assert.ok(globalConfiguration.getAnimationMode() instanceof Configuration.AnimationMode, "The result from getAnimationMode() is an AnimationMode instance");
		assert.ok(sap.ui.getCore().getConfiguration().getAnimationMode() instanceof Configuration.AnimationMode, "The result from getAnimationMode() is an AnimationMode instance");
		
		Configuration.setAnimationMode(Configuration.AnimationMode.minimal);
		assert.strictEqual(globalConfiguration.getAnimationMode(), Configuration.AnimationMode.minimal, "The animation mode is set to minimal");
		
		globalConfiguration.setAnimationMode(globalConfiguration.AnimationMode.full);
		assert.strictEqual(Configuration.getAnimationMode(), Configuration.AnimationMode.full, "The animation mode is set to full");
		
		sap.ui.getCore().getConfiguration().setAnimationMode(sap.ui.getCore().getConfiguration().AnimationMode.none);
		assert.strictEqual(Configuration.getAnimationMode(), globalConfiguration.AnimationMode.none, "The animation mode is set to none");
	});
	
	QUnit.test("SecurityTokenHandlers", function (assert) {
		assert.ok(Array.isArray(Configuration.getSecurityTokenHandlers()), "Type is Array");
		assert.ok(Array.isArray(globalConfiguration.getSecurityTokenHandlers()), "Type is Array");
		assert.ok(Array.isArray(sap.ui.getCore().getConfiguration().getSecurityTokenHandlers()), "Type is Array");
		
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

});
