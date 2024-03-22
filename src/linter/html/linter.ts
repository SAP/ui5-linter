import { taskStart } from "../../detectors/util/perf.js";

import type { TranspileResult } from "../../detectors/transpilers/AbstractTranspiler.js";
import type { ReadStream } from "node:fs";


export async function lintHtml(resourceName: string, contentStream: ReadStream): Promise<TranspileResult> {
	const taskLintEnd = taskStart("Static lint", resourceName);
	taskLintEnd();

	return { messages: [], source: "", map: "" };
}
