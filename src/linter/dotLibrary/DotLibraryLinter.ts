import {LintMessageSeverity} from "../LinterContext.js";
import LinterContext from "../LinterContext.js";
import deprecatedLibraries from "../../utils/deprecatedLibs.js";
import {DataWithPosition, fromYaml, getPosition} from "data-with-position";
import {parseXML} from "../../utils/xmlParser.js";
import {ReadStream} from "node:fs";

interface DotLibraryWithPosInfo extends DataWithPosition {
	library?: {
		dependencies?: {
			dependency?: {
				libraryName: string;
			}
		}[];
	};
	// TODO: add structure for line/column info
}

export default class DotLibraryLinter {
	#contentStream;
	#resourcePath;
	#context: LinterContext;

	constructor(resourcePath: string, contentStream: ReadStream, context: LinterContext) {
		this.#contentStream = contentStream;
		this.#resourcePath = resourcePath;
		this.#context = context;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async lint() {
		try {

			const parsedDotLibraryWithPosInfo = await this.#parseDotLibrary(this.#contentStream);
			this.#analyzeDotLibrary(parsedDotLibraryWithPosInfo);
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

	async #parseDotLibrary(contentStream: ReadStream): DotLibraryWithPosInfo {
		await parseXML(contentStream, (event, tag) => {
			if (tag instanceof SaxTag &&
				event === SaxEventType.CloseTag &&
				tag.value === "libraryName") {
					console.log(tag);
				}
		});
	}

	#analyzeDotLibrary(xml: DotLibraryWithPosInfo) {
		// TODO: add detection of 'library.dependencies[].dependency.libraryName'

		// // Check for deprecated libraries
		// yaml?.framework?.libraries?.forEach((lib) => {
		// 	if (deprecatedLibraries.includes(lib.name.toString())) {
		// 		const positionInfo = getPosition(lib);
		// 		this.#context.addLintingMessage(this.#resourcePath, {
		// 			ruleId: "ui5-linter-no-deprecated-api",
		// 			severity: LintMessageSeverity.Error,
		// 			fatal: undefined,
		// 			line: positionInfo.start.line + offset,
		// 			column: positionInfo.start.column,
		// 			message: `Use of deprecated library '${lib.name}'`,
		// 		});
		// 	}
		// });
	}
}
