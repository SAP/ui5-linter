import UI5YamlLinter from "./UI5YamlLinter.js";
import {taskStart} from "../../detectors/util/perf.js";

import type {TranspileResult} from "../../detectors/transpilers/AbstractTranspiler.js";

export async function lintUI5Yaml(resourceName: string, content: string): Promise<TranspileResult> {
	const taskLintEnd = taskStart("Static lint", resourceName);
	const linter = new UI5YamlLinter(content, resourceName);
	const {messages} = await linter.getReport();
	taskLintEnd();

	return {messages, source: content, map: ""};
}
