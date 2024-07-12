import {LintMessageSeverity} from "../LinterContext.js";
import LinterContext from "../LinterContext.js";
import deprecatedLibs from "../../utils/deprecatedLibs.js";
import {SaxEventType, Tag as SaxTag} from "sax-wasm";
import {parseXML} from "../../utils/xmlParser.js";
import {ReadStream} from "node:fs";

export default class DotLibraryLinter {
	#contentStream;
	#resourcePath;
	#context: LinterContext;

	constructor(resourcePath: string, contentStream: ReadStream, context: LinterContext) {
		this.#contentStream = contentStream;
		this.#resourcePath = resourcePath;
		this.#context = context;
	}

	async lint() {
		try {
			const parsedDotLibraryWithPosInfo = await this.#parseDotLibrary(this.#contentStream);
			this.#analyzeDeprecatedLibs(parsedDotLibraryWithPosInfo);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.#context.addLintingMessage(this.#resourcePath, {
				severity: LintMessageSeverity.Error,
				message,
				ruleId: "ui5-linter-parsing-error",
				fatal: true,
			});
		}
	}

	async #parseDotLibrary(contentStream: ReadStream): Promise<string[]> {
		const libs = new Set();
		await parseXML(contentStream, (event, tag) => {
			if (tag instanceof SaxTag &&
				event === SaxEventType.CloseTag &&
				tag.value === "libraryName") {
				libs.add(tag.textNodes[0].value);
			}
		});

		return Array.from(libs) as string[];
	}

	#analyzeDeprecatedLibs(libs: string[]) {
		// // Check for deprecated libraries
		libs.forEach((lib) => {
			if (deprecatedLibs.includes(lib)) {
				// const positionInfo = getPosition(lib);
				// this.#context.addLintingMessage(this.#resourcePath, {
				// 	ruleId: "ui5-linter-no-deprecated-api",
				// 	severity: LintMessageSeverity.Error,
				// 	fatal: undefined,
				// 	line: positionInfo.start.line + offset,
				// 	column: positionInfo.start.column,
				// 	message: `Use of deprecated library '${lib.name}'`,
				// });
			}
		});
	}
}
