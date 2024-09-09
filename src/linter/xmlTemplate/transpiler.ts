import {SaxEventType, SAXParser, Tag as SaxTag} from "sax-wasm";
import {ReadStream} from "node:fs";
import fs from "node:fs/promises";
import {finished} from "node:stream/promises";
import {taskStart} from "../../utils/perf.js";
import LinterContext, {TranspileResult} from "../LinterContext.js";
import Parser from "./Parser.js";
import {getLogger} from "@ui5/logger";
import {createRequire} from "node:module";
import {MESSAGE} from "../messages.js";
const require = createRequire(import.meta.url);

const log = getLogger("linter:xmlTemplate:transpiler");

export interface ApiExtract {
	framework: {
		name: string;
		version: string;
	};
	defaultAggregations: Record<string, string>;
}

let saxWasmBuffer: Buffer;
let apiExtract: ApiExtract;

export default async function transpileXml(
	resourcePath: string, contentStream: ReadStream, context: LinterContext
): Promise<TranspileResult | undefined> {
	await init();
	try {
		const taskEnd = taskStart("Transpile XML", resourcePath, true);
		const res = await transpileXmlToJs(resourcePath, contentStream, context);
		taskEnd();
		if (!res.source) {
			log.verbose(`XML transpiler returned no result for ${resourcePath}`);
			return res;
		}
		return res;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		context.addLintingMessage(resourcePath, MESSAGE.PARSING_ERROR, {message});
	}
}

let initializing: Promise<void>;
async function init() {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	if (initializing) {
		return initializing;
	}
	// Get the path to the WebAssembly binary and load it
	const saxPath = require.resolve("sax-wasm/lib/sax-wasm.wasm");
	const taskEnd = taskStart("XML Transpiler initialization");

	return initializing = Promise.all([
		fs.readFile(saxPath),
		fs.readFile(new URL("../../../resources/api-extract.json", import.meta.url), {encoding: "utf-8"}),
	]).then((results) => {
		saxWasmBuffer = results[0];
		apiExtract = JSON.parse(results[1]) as ApiExtract;
		taskEnd();
	});
}

async function transpileXmlToJs(
	resourcePath: string, contentStream: ReadStream, context: LinterContext
): Promise<TranspileResult> {
	const parser = new Parser(resourcePath, apiExtract, context);

	// Initialize parser
	const options = {highWaterMark: 32 * 1024}; // 32k chunks
	const saxParser = new SAXParser(
		SaxEventType.OpenTag | SaxEventType.CloseTag,
		options);

	saxParser.eventHandler = (event, tag) => {
		if (tag instanceof SaxTag) {
			if (event === SaxEventType.OpenTag) {
				parser.pushTag(tag);
			} else if (event === SaxEventType.CloseTag) {
				parser.popTag(tag);
			}
		}
	};

	// Instantiate and prepare the wasm for parsing
	if (!await saxParser.prepareWasm(saxWasmBuffer)) {
		throw new Error("Unknown error during WASM Initialization");
	}

	// stream from a file in the current directory
	contentStream.on("data", (chunk: Uint8Array) => {
		try {
			saxParser.write(chunk);
		} catch (err) {
			if (err instanceof Error) {
				// In case of an error, destroy the content stream to make the
				// error bubble up to our callers
				contentStream.destroy(err);
			} else {
				throw err;
			}
		}
	});
	await finished(contentStream);
	saxParser.end();

	return parser.generate();
}
