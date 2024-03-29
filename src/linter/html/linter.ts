import {taskStart} from "../../detectors/util/perf.js";
import {extractScriptTags} from "../../detectors/transpilers/html/parser.js";
import {LintMessageSeverity} from "../../detectors/AbstractDetector.js";
import HtmlReporter from "./HtmlReporter.js";

import type {TranspileResult} from "../../detectors/transpilers/AbstractTranspiler.js";
import type {ReadStream} from "node:fs";

export async function lintHtml(resourceName: string, contentStream: ReadStream): Promise<TranspileResult> {
	const taskLintEnd = taskStart("Linting HTML", resourceName);
	const report = new HtmlReporter(resourceName);

	const scriptTags = await extractScriptTags(contentStream);
	const jsScriptTags = scriptTags.filter((tag) => tag.attributes.every((attr) => {
		// The "type" attribute of the script tag should be
		// 1. not set (default),
		// 2. an empty string,
		// 3. or a JavaScript MIME type (text/javascript)
		// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type#attribute_is_not_set_default_an_empty_string_or_a_javascript_mime_type
		return attr.name.value !== "type" ||
			(attr.name.value === "type" &&
			(attr.value.value === "" || attr.value.value === "text/javascript"));
	}));

	jsScriptTags.forEach((tag) => {
		const scriptContent = tag.textNodes?.map((tNode) => tNode.value).join("").trim();

		if (scriptContent) {
			report.addMessage({
				node: tag,
				severity: LintMessageSeverity.Error,
				ruleId: "ui5-linter-csp-compliance",
				message: `Use of inline javascript`,
				messageDetails: "In order to avoid CSP errors, remove the usage of inline javascript",
			});
		}
	});

	taskLintEnd();

	const {messages} = report.getReport();
	return {messages, source: "", map: ""};
}
