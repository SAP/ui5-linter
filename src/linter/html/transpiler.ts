import {ReadStream} from "node:fs";
import {extractJSScriptTags} from "./parser.js";
import HtmlReporter from "./HtmlReporter.js";
import LinterContext, {LintMessageSeverity, TranspileResult} from "../LinterContext.js";
import {taskStart} from "../../util/perf.js";

export default async function transpileHtml(
	resourceName: string, contentStream: ReadStream, context: LinterContext
): Promise<TranspileResult> {
	try {
		const taskEnd = taskStart("Transpile XML", resourceName, true);
		const report = new HtmlReporter(resourceName, context);
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

		taskEnd();
		return {source: "", map: ""};
	} catch (err) {
		if (err instanceof Error) {
			throw new Error(`Failed to transpile resource ${resourceName}: ${err.message}`, {
				cause: err,
			});
		} else {
			throw err;
		}
	}
}
