import fs from "fs/promises";
import path from "node:path";
import {isLogLevelEnabled} from "@ui5/logger";
import {
	generate,
	TypeNameFix,
} from "@ui5-language-assistant/semantic-model";
import {
	UI5SemanticModel,
} from "@ui5-language-assistant/semantic-model-types";

interface ApiJson {
	library: string;
}

function getTypeNameFix(): TypeNameFix {
	// From https://github.com/SAP/ui5-language-assistant/blob/44114f34de59e8d415b06b470be6fa3697c7414c/packages/context/src/ui5-model.ts#L229
	const fixes: TypeNameFix = {
		"Control": "sap.ui.core.Control",
		"Element": "sap.ui.core.Element",
		"array": "object[]",
		"Array": "object[]",
		"bloolean": "boolean",
		"any": "any",
		"sap.m.PlanningCalendarHeader": undefined,
		"sap.m.TimePickerSlider": undefined,
		"sap.ui.layout.ResponsiveSplitterPage": undefined,
		"sap.gantt.misc.AxisTime": "sap.gantt.misc.AxisTimes",
		"sap.gantt.control.Toolbar": undefined,
		"sap.gantt.DragOrientation": undefined,
		"sap.gantt.simple.GanttHeader": undefined,
		"sap.gantt.simple.InnerGanttChart": undefined,
		"sap.rules.ui.RuleBase": undefined,
		"sap.ui.generic.app.transaction.BaseController": undefined,
		"sap.ui.vk.BillboardTextEncoding": undefined,
		"sap.ui.vk.BillboardStyle": undefined,
		"sap.ui.vk.BillboardBorderLineStyle": undefined,
		"sap.ui.vk.BillboardHorizontalAlignment": undefined,
		"sap.ui.vk.BillboardCoordinateSpace": undefined,
		"sap.ui.vk.DetailViewType": undefined,
		"sap.ui.vk.DetailViewShape": undefined,
		"sap.ui.vk.tools.HitTestIdMode": undefined,
		"sap.ui.vk.tools.CoordinateSystem": undefined,
		"sap.ui.vk.AnimationTimeSlider": undefined,
		"sap.ui.vk.SelectionMode": undefined,
		"sap.ui.vk.RenderMode": undefined,
		"sap.viz.ui5.controls.VizRangeSlider": undefined,
	};
	return fixes;
}

let model: UI5SemanticModel | null = null;
export async function createSemanticModel(apiJsonsRoot: string, sapui5Version: string): Promise<UI5SemanticModel> {
	if (model) {
		return model;
	}
	const indexJson: Record<string, unknown> = {};
	const apiJsonFiles = await fs.readdir(apiJsonsRoot);
	for (const apiJsonFile of apiJsonFiles) {
		const apiJson = await fs.readFile(path.join(apiJsonsRoot, apiJsonFile), "utf-8");
		const apiJsonParsed = JSON.parse(apiJson) as ApiJson;
		indexJson[apiJsonParsed.library] = apiJsonParsed;
	}
	/* eslint-disable no-console */
	let originalConsoleError;
	if (!isLogLevelEnabled("verbose")) {
		// Overwrite console.error with a noop since #generate produces a lot of messages error messages
		// that we don't want to deal with right now
		originalConsoleError = console.error;
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		console.error = () => {};
	}
	model = generate({
		version: sapui5Version,
		libraries: indexJson,
		typeNameFix: getTypeNameFix(),
		strict: false, // Throw instead of log errors
		printValidationErrors: false,
	});
	if (originalConsoleError) {
		console.error = originalConsoleError;
	}
	/* eslint-enable no-console */
	return model;
}
