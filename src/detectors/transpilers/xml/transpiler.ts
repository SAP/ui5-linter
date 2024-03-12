import {SaxEventType, SAXParser, Tag as SaxTag} from "sax-wasm";
import {ReadStream} from "node:fs";
import fs from "node:fs/promises";
import {finished} from "node:stream/promises";
import {taskStart} from "../../util/perf.js";
import {TranspileResult} from "../AbstractTranspiler.js";
import Parser from "./Parser.js";
import {getLogger} from "@ui5/logger";
import {createRequire} from "node:module";
const require = createRequire(import.meta.url);

const log = getLogger("transpilers:xml:transpiler");

export interface ApiExtract {
	framework: {
		name: string;
		version: string;
	};
	defaultAggregations: Record<string, string>;
}

let saxWasmBuffer: Buffer;
let apiExtract: ApiExtract;

export async function xmlToJs(resourceName: string, contentStream: ReadStream): Promise<TranspileResult> {
	await init();
	try {
		const taskEnd = taskStart("Transpile XML", resourceName, true);
		const res = await transpileXmlToJs(resourceName, contentStream);
		taskEnd();
		if (!res.source) {
			log.verbose(`XML transpiler returned no result for ${resourceName}`);
			return res;
		}
		return res;
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

let initializing: Promise<void>;
async function init() {
	if (initializing) {
		return initializing;
	}
	// Get the path to the WebAssembly binary and load it
	const saxPath = require.resolve("sax-wasm/lib/sax-wasm.wasm");
	const taskEnd = taskStart("XML Transpiler initialization");

	return initializing = Promise.all([
		fs.readFile(saxPath),
		fs.readFile(new URL("../../../../resources/api-extract.json", import.meta.url), {encoding: "utf-8"}),
	]).then(async (results) => {
		saxWasmBuffer = results[0];
		apiExtract = JSON.parse(results[1]);
		taskEnd();
	});
}

async function transpileXmlToJs(resourceName: string, contentStream: ReadStream): Promise<TranspileResult> {
	const parser = new Parser(resourceName, apiExtract);

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
