import test from "ava";
import {resolveUniqueName} from "../../../../src/linter/ui5Types/utils/utils.js";

test("resolveUniqueName: sap/ui/thirdparty/jquery", (t) => {
	t.is(resolveUniqueName("sap/ui/thirdparty/jquery"), "jQuery");
});

test("resolveUniqueName: Absolute framework module name", (t) => {
	t.is(resolveUniqueName("sap/ui/core/Control"), "Control");
});

test("resolveUniqueName: Relative module name", (t) => {
	t.is(resolveUniqueName("./Control"), "Control");
});

test("resolveUniqueName: Absolute framework library module", (t) => {
	t.is(resolveUniqueName("sap/ui/core/library"), "coreLibrary");
});

test("resolveUniqueName: Relative library module", (t) => {
	t.is(resolveUniqueName("./library"), "library");
});

test("resolveUniqueName: Relative library module (one folder up)", (t) => {
	t.is(resolveUniqueName("../library"), "library");
});

test("resolveUniqueName: Controller module", (t) => {
	t.is(resolveUniqueName("./controller/App.controller"), "App_controller");
});

test("resolveUniqueName: sap/ui/thirdparty/sinon-qunit", (t) => {
	t.is(resolveUniqueName("sap/ui/thirdparty/sinon-qunit"), "sinonQunit");
});

test("resolveUniqueName: Module name with multiple illegal characters", (t) => {
	t.is(resolveUniqueName("./my-super--module"), "mySuper_module");
});
