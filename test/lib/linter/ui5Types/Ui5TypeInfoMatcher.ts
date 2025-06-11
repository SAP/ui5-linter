import anyTest, {TestFn} from "ava";
import Ui5TypeInfoMatcher from "../../../../src/linter/ui5Types/Ui5TypeInfoMatcher.js";
import {Ui5TypeInfo, Ui5TypeInfoKind} from "../../../../src/linter/ui5Types/Ui5TypeInfo.js";
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
				library: "my.lib.name",
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
				library: "my.lib.name",
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
				library: "my.lib.name",
			},
		},
	});
	t.is(res, "foo");
});

test("TypeInfoMatcher: Namespace", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">();
	filter.declareNamespace("jQuery", [
		filter.namespace("sap", "bar"),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.Namespace,
		name: "sap",
		parent: {
			kind: Ui5TypeInfoKind.Namespace,
			name: "jQuery",
		},
	});
	t.is(res, "bar");
});

test("TypeInfoMatcher: Namespaces", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">();
	filter.declareNamespaces(["jQuery2", "jQuery"], [
		filter.namespace("sap", "bar"),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.Namespace,
		name: "sap",
		parent: {
			kind: Ui5TypeInfoKind.Namespace,
			name: "jQuery",
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
			library: "my.lib.name",
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
					library: "my.lib.name",
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
					library: "my.lib.name",
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
			filter.metadataProperty("text", "foo"),
			filter.metadataAggregation("content", "bar"),
			filter.metadataAssociation("assoc", "bar"),
			filter.metadataEvent("event", "bar"),
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
				library: "my.lib.name",
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
				library: "my.lib.name",
			},
		},
	});
	t.is(resAggregation, "bar");
});

test("TypeInfoMatcher: EnumMember does not match partially on Enum", (t) => {
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
					library: "my.lib.name",
				},
			},
		},
	});
	t.is(res, undefined);
});

test("TypeInfoMatcher: Library name does not match", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("jQuery", [
		filter.namespace("sap", [
			filter.function("func", "bar"),
		]),
	]);
	const res = filter.match({
		kind: Ui5TypeInfoKind.Function,
		name: "func",
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
	t.is(res, undefined);
});

test("TypeInfoMatcher: Module without namespace", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">();
	t.throws(() => {
		filter.declareModule("jQuery", [
			filter.namespace("sap", "bar"),
		]);
	}, {
		message: "Library name must be defined to create a module node",
	}, `Threw with expected error message`);
});

test("TypeInfoMatcher: No root", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">();
	const res = filter.match({
		kind: Ui5TypeInfoKind.Module,
		name: "jQuery",
		library: "sap.ui.core",
	});
	t.is(res, undefined);
});

test("TypeInfoMatcher: Invalid type info", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModule("jQuery", [
		filter.namespace("sap", [
			filter.function("func", "bar"),
		]),
	]);
	t.throws(() => {
		filter.match({
			name: "jQuery",
			library: "my.lib.name",
		} as Ui5TypeInfo);
	}, {
		message: `Provided UI5 Type Info has an unexpected kind of root node`,
	}, `Threw with expected error message`);
});

test("TypeInfoMatcher: Plural Methods", (t) => {
	const filter = new Ui5TypeInfoMatcher<"foo" | "bar">("my.lib.name");
	filter.declareModules(["sap/m/Button1", "sap/foo/Button2"], [
		...filter.managedObjectSettings(["$ButtonSettings1", "$ButtonSettings2"], [
			...filter.metadataProperties(["text1", "text2"], "foo"),
			...filter.metadataAggregations(["content1", "content2"], "bar"),
			...filter.metadataAssociations(["association1", "association2"], "foo"),
			...filter.metadataEvents(["event1", "event2"], "bar"),
		]),
		...filter.enums(["ButtonType1", "ButtonType2"], [
			...filter.enumMembers(["Default1", "Default2"], "foo"),
		]),
		...filter.classes(["Button1", "Button2"], [
			...filter.methods(["method1", "method2"], "bar"),
			...filter.properties(["property1", "property2"], "foo"),
		]),
		...filter.namespaces(["sap1", "sap2"], [
			...filter.functions(["function1", "function2"], "bar"),
		]),
	]);
	const resProperty = filter.match({
		kind: Ui5TypeInfoKind.MetadataProperty,
		name: "text2",
		parent: {
			kind: Ui5TypeInfoKind.ManagedObjectSettings,
			name: "$ButtonSettings2",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				name: "sap/m/Button1",
				library: "my.lib.name",
			},
		},
	});
	t.is(resProperty, "foo");

	const resEvent = filter.match({
		kind: Ui5TypeInfoKind.MetadataEvent,
		name: "event2",
		parent: {
			kind: Ui5TypeInfoKind.ManagedObjectSettings,
			name: "$ButtonSettings2",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				name: "sap/foo/Button2",
				library: "my.lib.name",
			},
		},
	});
	t.is(resEvent, "bar");

	const resFunction = filter.match({
		kind: Ui5TypeInfoKind.Function,
		name: "function2",
		parent: {
			kind: Ui5TypeInfoKind.Namespace,
			name: "sap2",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				name: "sap/foo/Button2",
				library: "my.lib.name",
			},
		},
	});
	t.is(resFunction, "bar");
});
