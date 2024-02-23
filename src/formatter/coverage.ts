import path from "node:path";
import {
	LintResult,
	LintMessageSeverity,
	CoverageInfo,
	CoverageCategory
} from "../detectors/AbstractDetector.js";
import {readFile} from "fs/promises";

const visualizedSpace = "\u00b7";
const visualizedTab = "\u00bb";
const visualizedTabs : string[] = [];

function formatSeverity(severity: LintMessageSeverity) {
	if (severity === LintMessageSeverity.Error) {
		return "error";
	} else if (severity === LintMessageSeverity.Warning) {
		return "warning";
	} else {
		throw new Error(`Unknown severity: ${severity}`);
	}
}

function expandTabs(line: string, tabsize = 4) {
	let last = 0;
	let length = 0;
	return line.replace(/[ \t]/g, function(tab, offset) {
		length += offset - last;
		if ( tab === "\t" ) {
			const n = tabsize - length % tabsize;
			length += n;
			last++;
			return visualizedTabs[n] ?? (visualizedTabs[n] = visualizedTab.padEnd(n, " "));
		}
		length++;
		last++;
		return visualizedSpace;
	});
}

function escape(str: string) {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

export class Coverage {
	#buffer: string = "";

	async format(lintResults: LintResult[]) {


		this.#writeln(`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>UI5Lint Coverage Report ${new Date().toLocaleString()}</title>
	<style>
	html {
		font-family: Arial, sans-serif;
		font-size: 1em;
	}
	.file {
		margin-bottom: 2rem;
	}
	.codeline {
		padding-left: 1rem;
		font-family: monospace;
	}
	.codeline .line {
		text-align: right;
		padding-right: 1rem;
		width: 5ex;
		display: inline-block;
	}
	.codeline.has-messages .line {
		background-color: red;
		color: white;
	}
	.codeline .code {
		white-space: pre;
	}
	.codeline.has-messages .code {
		color: red;
	}
	.codeline .messages {
		background-color: red;
		color: white;
	}
	.codeline.no-coverage .line {
		background-color: grey;
		color: white;
	}
	.codeline.no-coverage .code {
		color: grey;
	}
	</style>
</head>
<body>`);

		for (const {filePath, messages, coverageInfo} of lintResults) {
			const fileContent = await readFile(filePath, {encoding: "utf-8"});
			const relativeFilePath = path.relative(process.cwd(), filePath);

			this.#writeln(`<div class="file"><span>${escape(relativeFilePath)}</span>`);

			fileContent.split("\n").forEach((code, i) => {
				const line = i + 1;
				this.#renderLine(
					expandTabs(code), line,
					messages.filter((msg) => msg.line === line),
					coverageInfo.filter(
						(info) => info.line === line && info.category === CoverageCategory.CallExpressionUnknownType
					)
				);
			});

			this.#writeln(`</div>`);
		}

		this.#writeln(
			`	</body>
</html>`);

		return this.#buffer;
	}

	#renderLine(code: string, line: number, messages: LintResult["messages"], coverageInfo: CoverageInfo[]) {
		const classes = ["codeline"];
		if (messages.length) {
			classes.push("has-messages");
		} else if (coverageInfo.length) {
			classes.push("no-coverage");
		}

		this.#writeln(`<div class="${classes.join(" ")}">`);

		this.#writeln(`<span class="line">${line}</span>`);
		this.#writeln(`<span class="code">${escape(code)}</span>`);

		if (messages.length) {
			this.#writeln(`<span class="messages">${escape(
				messages.map(
					(msg) => `${formatSeverity(msg.severity)} ${msg.message}`
				).join(" & ")
			)}</span>`);
		}

		this.#writeln(`</div>`);
	}

	#write(str: string) {
		this.#buffer += str;
	}
	#writeln(str: string) {
		this.#buffer += str + "\n";
	}

}
