import anyTest, {TestFn} from "ava";
import Ui5TypeInfoMatcher from "../../../../src/linter/ui5Types/Ui5TypeInfoMatcher.js";
import {Ui5TypeInfoKind} from "../../../../src/linter/ui5Types/Ui5TypeInfo.js";
const test = anyTest as TestFn<object>;

test("TypeInfoMatcher: Method", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("sap/ui/core/Core", [
		filter.class("Core", [
			filter.method("applyTheme", "foo"),
			filter.method("attachInit", "bar"),
		]),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.Method,
		name: "attachInit",
		parent: {
			kind: Ui5TypeInfoKind.Class,
			name: "Core",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				name: "sap/ui/core/Core",
				library: "sap.ui.core",
			},
		},
	});

	t.is(res, "bar");
});

test("TypeInfoMatcher: Enum", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("jQuery", [
		filter.namespace("sap", [
			filter.function("assert", "foo"),
			...filter.enums(["Level", "LogLevel"], "bar"),
		]),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.Enum,
		name: "LogLevel",
		parent: {
			kind: Ui5TypeInfoKind.Namespace,
			name: "sap",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				name: "jQuery",
				library: "sap.ui.core",
			},
		},
	});

	t.is(res, "bar");
});

test("TypeInfoMatcher: Property", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("sap/ui/core/Core", [
		filter.class("Core", [
			filter.property("busy", "foo"),
		]),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.Property,
		name: "busy",
		parent: {
			kind: Ui5TypeInfoKind.Class,
			name: "Core",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				name: "sap/ui/core/Core",
				library: "sap.ui.core",
			},
		},
	});
	t.is(res, "foo");
});

test("TypeInfoMatcher: Namespace", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("jQuery", [
		filter.namespace("sap", "bar"),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.Namespace,
		name: "sap",
		parent: {
			kind: Ui5TypeInfoKind.Module,
			name: "jQuery",
			library: "sap.ui.core",
		},
	});
	t.is(res, "bar");
});

test("TypeInfoMatcher: Class", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("sap/ui/core/Core", [
		filter.class("Core", "foo"),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.Class,
		name: "Core",
		parent: {
			kind: Ui5TypeInfoKind.Module,
			name: "sap/ui/core/Core",
			library: "sap.ui.core",
		},
	});
	t.is(res, "foo");
});

test("TypeInfoMatcher: EnumMember", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("jQuery", [
		filter.namespace("sap", [
			filter.enum("LogLevel", [
				filter.enumMember("DEBUG", "bar"),
			]),
		]),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.EnumMember,
		name: "DEBUG",
		parent: {
			kind: Ui5TypeInfoKind.Enum,
			name: "LogLevel",
			parent: {
				kind: Ui5TypeInfoKind.Namespace,
				name: "sap",
				parent: {
					kind: Ui5TypeInfoKind.Module,
					name: "jQuery",
					library: "sap.ui.core",
				},
			},
		},
	});
	t.is(res, "bar");
});

test("TypeInfoMatcher: Nested Namespace", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("jQuery", [
		filter.namespace("sap", [
			filter.namespace("log", [
				filter.function("doSomething", "foo"),
			]),
		]),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.Function,
		name: "doSomething",
		parent: {
			kind: Ui5TypeInfoKind.Namespace,
			name: "log",
			parent: {
				kind: Ui5TypeInfoKind.Namespace,
				name: "sap",
				parent: {
					kind: Ui5TypeInfoKind.Module,
					name: "jQuery",
					library: "sap.ui.core",
				},
			},
		},
	});
	t.is(res, "foo");
});

test("TypeInfoMatcher: ManagedObjectSettings", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("sap/m/Button", [
		filter.managedObjectSetting("$ButtonSettings", [
			filter.medadataProperty("text", "foo"),
			filter.medadataAggregation("content", "bar"),
		]),
	]);
	const resProperty = filter.match({
		kind: Ui5TypeInfoKind.MetadataProperty,
		name: "text",
		parent: {
			kind: Ui5TypeInfoKind.ManagedObjectSettings,
			name: "$ButtonSettings",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				name: "sap/m/Button",
				library: "sap.m",
			},
		},
	});
	t.is(resProperty, "foo");

	const resAggregation = filter.match({
		kind: Ui5TypeInfoKind.MetadataAggregation,
		name: "content",
		parent: {
			kind: Ui5TypeInfoKind.ManagedObjectSettings,
			name: "$ButtonSettings",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				name: "sap/m/Button",
				library: "sap.m",
			},
		},
	});
	t.is(resAggregation, "bar");
});

test("TypeInfoMatcher: EnumMember does not match partially on Enum ", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("jQuery", [
		filter.namespace("sap", [
			filter.enum("LogLevel", "bar"),
		]),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.EnumMember,
		name: "DEBUG",
		parent: {
			kind: Ui5TypeInfoKind.Enum,
			name: "LogLevel",
			parent: {
				kind: Ui5TypeInfoKind.Namespace,
				name: "sap",
				parent: {
					kind: Ui5TypeInfoKind.Module,
					name: "jQuery",
					library: "sap.ui.core",
				},
			},
		},
	});
	t.is(res, undefined);
});
