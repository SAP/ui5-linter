import {LintMessageSeverity} from "../LinterContext.js";
import LinterContext from "../LinterContext.js";
import {deprecatedLibraries} from "../../utils/deprecations.js";
import {SaxEventType, Tag as SaxTag} from "sax-wasm";
import {parseXML} from "../../utils/xmlParser.js";
import {ReadStream} from "node:fs";
import {RULES, MESSAGES, formatMessage} from "../linterReporting.js";

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
			const dotLibraryDependencyTags = await this.#parseDotLibrary(this.#contentStream);
			this.#analyzeDeprecatedLibs(dotLibraryDependencyTags);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.#context.addLintingMessage(this.#resourcePath, {
				severity: LintMessageSeverity.Error,
				message,
				ruleId: RULES["ui5-linter-parsing-error"],
				fatal: true,
			});
		}
	}

	async #parseDotLibrary(contentStream: ReadStream): Promise<SaxTag[]> {
		const libs = new Set();
		const tagsStack: string[] = [];
		const libNamePath = ["library", "dependencies", "dependency"];
		await parseXML(contentStream, (event, tag) => {
			if (!(tag instanceof SaxTag)) {
				return;
			}

			if (event === SaxEventType.OpenTag && !tag.selfClosing) {
				tagsStack.push(tag.value);
			} else if (event === SaxEventType.CloseTag && !tag.selfClosing) {
				tagsStack.pop();
			}

			if (event === SaxEventType.CloseTag &&
				tag.value === "libraryName") {
				const path = tagsStack.slice(-1 * libNamePath.length);
				const isMatchingPath = libNamePath.every((lib, index) => lib === path[index]);

				if (isMatchingPath) {
					libs.add(tag);
				}
			}
		});

		return Array.from(libs) as SaxTag[];
	}

	#analyzeDeprecatedLibs(libs: SaxTag[]) {
		// Check for deprecated libraries
		libs.forEach((lib) => {
			const {line, character: column} = lib.openStart;
			// textNodes is always an array, but it might be empty
			const libName = lib.textNodes[0]?.value;

			if (deprecatedLibraries.includes(libName)) {
				this.#context.addLintingMessage(this.#resourcePath, {
					ruleId: RULES["ui5-linter-no-deprecated-library"],
					severity: LintMessageSeverity.Error,
					fatal: undefined,
					line: line + 1,
					column: column + 1,
					message: formatMessage(MESSAGES.SHORT__DEPRECATED_LIBRARY, libName),
				});
			}
		});
	}
}
