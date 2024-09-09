import LinterContext from "../LinterContext.js";
import {deprecatedLibraries} from "../../utils/deprecations.js";
import {SaxEventType, Tag as SaxTag} from "sax-wasm";
import {parseXML} from "../../utils/xmlParser.js";
import {ReadStream} from "node:fs";
import {MESSAGE} from "../messages.js";

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
			this.#context.addLintingMessage(this.#resourcePath, MESSAGE.PARSING_ERROR, {message});
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
				const isMatchingPath = libNamePath.length === tagsStack.length &&
					libNamePath.every((lib, index) => lib === tagsStack[index]);

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
			// textNodes is always an array, but it might be empty
			const libraryName = lib.textNodes[0]?.value;

			if (deprecatedLibraries.includes(libraryName)) {
				this.#context.addLintingMessage(
					this.#resourcePath,
					MESSAGE.DEPRECATED_LIBRARY,
					{libraryName},
					{
						line: lib.openStart.line + 1,
						column: lib.openStart.character + 1,
					}
				);
			}
		});
	}
}
