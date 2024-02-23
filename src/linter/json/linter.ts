
import ManifestLinter from "./ManifestLinter.js";
import {taskStart} from "../../detectors/util/perf.js";

import type {TranspileResult} from "../../detectors/transpilers/AbstractTranspiler.js";

export async function lintManifest(resourceName: string, content: string): Promise<TranspileResult> {
	const taskLintEnd = taskStart("Static lint", resourceName);
	const linter = new ManifestLinter(content, resourceName);
	const {messages} = await linter.getReport();
	taskLintEnd();

	return {messages, source: content, map: ""};
}