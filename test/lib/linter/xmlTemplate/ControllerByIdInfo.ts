import test from "ava";
import ControllerByIdInfo from "../../../../src/linter/xmlTemplate/ControllerByIdInfo.js";

test("ControllerByIdInfo: No mappings", (t) => {
	const controllerByIdInfo = new ControllerByIdInfo();
	const mappings = controllerByIdInfo.getMappings();
	t.deepEqual(mappings, new Map());
});

test("ControllerByIdInfo: Mappings", (t) => {
	const controllerByIdInfo = new ControllerByIdInfo();
	controllerByIdInfo.addMappings("com.myapp.controller.App", new Map([
		["button", "sap/m/Button"],
		["input", "sap/m/Input"],
	]));
	controllerByIdInfo.addMappings("com.myapp.controller.Main", new Map([
		["button", "sap/m/Button"],
		["input", "sap/m/Input"],
	]));
	controllerByIdInfo.addMappings("com.myapp.controller.App", new Map([
		["button", "sap/ui/commons/Button"],
	]));
	controllerByIdInfo.addMappings("com.myapp.controller.App", new Map([
		["button", "com/myapp/control/Button"],
	]));

	const mappings = controllerByIdInfo.getMappings();
	t.deepEqual(mappings, new Map([
		["com.myapp.controller.App", new Map([
			["button", new Set(["sap/m/Button", "sap/ui/commons/Button", "com/myapp/control/Button"])],
			["input", new Set(["sap/m/Input"])],
		])],
		["com.myapp.controller.Main", new Map([
			["button", new Set(["sap/m/Button"])],
			["input", new Set(["sap/m/Input"])],
		])],
	]));
});

test("ControllerByIdInfo: Should not add empty mappings", (t) => {
	const controllerByIdInfo = new ControllerByIdInfo();
	controllerByIdInfo.addMappings("com.myapp.controller.App", new Map([]));

	const mappings = controllerByIdInfo.getMappings();
	t.deepEqual(mappings, new Map());
});
