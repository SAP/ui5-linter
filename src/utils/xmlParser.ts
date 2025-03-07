import type {ReadStream} from "node:fs";
import {Detail, Reader, SaxEventType, SAXParser, Tag, Text} from "sax-wasm";
import {finished} from "node:stream/promises";
import fs from "node:fs/promises";
import {createRequire} from "node:module";
import {Readable} from "node:stream";
const require = createRequire(import.meta.url);

export function isSaxParserToJSON(tag: unknown): tag is Tag {
	const tagAsSaxParserToJSON = tag as Tag;
	return !!tag &&
		Object.prototype.hasOwnProperty.call(tagAsSaxParserToJSON, "openStart") &&
		Object.prototype.hasOwnProperty.call(tagAsSaxParserToJSON, "openEnd") &&
		Object.prototype.hasOwnProperty.call(tagAsSaxParserToJSON, "closeStart") &&
		Object.prototype.hasOwnProperty.call(tagAsSaxParserToJSON, "closeEnd") &&
		Object.prototype.hasOwnProperty.call(tagAsSaxParserToJSON, "attributes") &&
		Object.prototype.hasOwnProperty.call(tagAsSaxParserToJSON, "textNodes");
}

export function isSaxText(tag: unknown): tag is Text {
	return !!tag &&
		Object.prototype.hasOwnProperty.call(tag, "start") &&
		Object.prototype.hasOwnProperty.call(tag, "end") &&
		Object.prototype.hasOwnProperty.call(tag, "value");
}

let saxWasmBuffer: Buffer;
async function initSaxWasm() {
	if (!saxWasmBuffer) {
		const saxPath = require.resolve("sax-wasm/lib/sax-wasm.wasm");
		saxWasmBuffer = await fs.readFile(saxPath);
	}

	return saxWasmBuffer;
}

export async function parseXML(
	contentStream: ReadStream, parseHandler: (type: SaxEventType, tag: Reader<Detail>) => void) {
	const saxWasmBuffer = await initSaxWasm();
	const saxParser = new SAXParser(SaxEventType.CloseTag + SaxEventType.OpenTag);

	// Instantiate and prepare the wasm for parsing
	if (!await saxParser.prepareWasm(saxWasmBuffer)) {
		throw new Error("Unknown error during WASM Initialization");
	}

	const webContentStream = Readable.toWeb(contentStream);

	for await (const [event, detail] of saxParser.parse(webContentStream.getReader())) {
		parseHandler(event, detail);
	}

	await finished(contentStream);
}
