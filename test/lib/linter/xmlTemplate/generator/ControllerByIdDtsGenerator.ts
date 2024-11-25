import test from "ava";
import {
	ControllerByIdDtsGenerator,
} from "../../../../../src/linter/xmlTemplate/generator/ControllerByIdDtsGenerator.js";
import ControllerByIdInfo from "../../../../../src/linter/xmlTemplate/ControllerByIdInfo.js";

test("ControllerByIdDtsGenerator: generate", (t) => {
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

	const generator = new ControllerByIdDtsGenerator(controllerByIdInfo);
	const result = generator.generate();
	t.snapshot(result);
});

test("ControllerByIdDtsGenerator: generate with empty info should return null", (t) => {
	const controllerByIdInfo = new ControllerByIdInfo();
	const generator = new ControllerByIdDtsGenerator(controllerByIdInfo);
	const result = generator.generate();
	t.is(result, null);
});
