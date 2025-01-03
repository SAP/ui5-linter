import type {ReadStream} from "node:fs";
import {Detail, SaxEventType, SAXParser} from "sax-wasm";
import {finished} from "node:stream/promises";
import fs from "node:fs/promises";
import {createRequire} from "node:module";
const require = createRequire(import.meta.url);

let saxWasmBuffer: Buffer;
async function initSaxWasm() {
	if (!saxWasmBuffer) {
		const saxPath = require.resolve("sax-wasm/lib/sax-wasm.wasm");
		saxWasmBuffer = await fs.readFile(saxPath);
	}

	return saxWasmBuffer;
}

export async function parseXML(contentStream: ReadStream, parseHandler: (type: SaxEventType, tag: Detail) => void) {
	const saxWasmBuffer = await initSaxWasm();
	const saxParser = new SAXParser(SaxEventType.CloseTag + SaxEventType.OpenTag);

	saxParser.eventHandler = parseHandler;

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
}
