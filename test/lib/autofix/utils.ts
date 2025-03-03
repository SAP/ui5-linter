import test from "ava";
import {getIdentifierForImport} from "../../../src/autofix/utils.js";

test("getIdentifierForImport: sap/ui/thirdparty/jquery", (t) => {
	t.is(getIdentifierForImport("sap/ui/thirdparty/jquery"), "jQuery");
});

test("getIdentifierForImport: Absolute framework module name", (t) => {
	t.is(getIdentifierForImport("sap/ui/core/Control"), "Control");
});

test("getIdentifierForImport: Relative module name", (t) => {
	t.is(getIdentifierForImport("./Control"), "Control");
});

test("getIdentifierForImport: Absolute framework library module", (t) => {
	t.is(getIdentifierForImport("sap/ui/core/library"), "coreLibrary");
});

test("getIdentifierForImport: Relative library module", (t) => {
	t.is(getIdentifierForImport("./library"), "library");
});

test("getIdentifierForImport: Relative library module (one folder up)", (t) => {
	t.is(getIdentifierForImport("../library"), "library");
});

test("getIdentifierForImport: Controller module", (t) => {
	t.is(getIdentifierForImport("./controller/App.controller"), "AppController");
});

test("getIdentifierForImport: sap/ui/thirdparty/sinon-qunit", (t) => {
	t.is(getIdentifierForImport("sap/ui/thirdparty/sinon-qunit"), "sinonQunit");
});
