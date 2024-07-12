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

	async #parseDotLibrary(contentStream: ReadStream): Promise<SaxTag[]> {
		const libs = new Set();
		await parseXML(contentStream, (event, tag) => {
			if (tag instanceof SaxTag &&
				event === SaxEventType.CloseTag &&
				tag.value === "libraryName") {
				libs.add(tag);
			}
		});

		return Array.from(libs) as SaxTag[];
	}

	#analyzeDeprecatedLibs(libs: SaxTag[]) {
		// // Check for deprecated libraries
		libs.forEach((lib) => {
			const libName = lib.textNodes[0].value;
			const {line, character: column} = lib.openStart;

			if (deprecatedLibs.includes(libName)) {
				this.#context.addLintingMessage(this.#resourcePath, {
					ruleId: "ui5-linter-no-deprecated-api",
					severity: LintMessageSeverity.Error,
					fatal: undefined,
					line: line + 1,
					column: column + 1,
					message: `Use of deprecated library '${libName}'`,
				});
			}
		});
	}
}
