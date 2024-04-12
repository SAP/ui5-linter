import {taskStart} from "../../detectors/util/perf.js";
import {extractJSScriptTags} from "../../detectors/transpilers/html/parser.js";
import {LintMessageSeverity} from "../../detectors/AbstractDetector.js";
import HtmlReporter from "./HtmlReporter.js";

import type {TranspileResult} from "../../detectors/transpilers/AbstractTranspiler.js";
import type {ReadStream} from "node:fs";

export async function lintHtml(resourceName: string, contentStream: ReadStream): Promise<TranspileResult> {
	const taskLintEnd = taskStart("Linting HTML", resourceName);
	const report = new HtmlReporter(resourceName);
	const jsScriptTags = await extractJSScriptTags(contentStream);

	jsScriptTags.forEach((tag) => {
		// Tags with src attribute do not parse and run inline code
		const hasSrc = tag.attributes.some((attr) => {
			return attr.name.value.toLowerCase() === "src";
		});

		if (!hasSrc && tag.textNodes?.length > 0) {
			report.addMessage({
				node: tag,
				severity: LintMessageSeverity.Warning,
				ruleId: "ui5-linter-csp-unsafe-inline-script",
				message: `Use of unsafe inline script`,
				messageDetails: "{@link topic:fe1a6dba940e479fb7c3bc753f92b28c Content Security Policy}",
			});
		}
	});

	taskLintEnd();

	const {messages} = report.getReport();
	return {messages, source: "", map: ""};
}
