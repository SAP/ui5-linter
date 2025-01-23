import type {ReadStream} from "node:fs";
import {AttributeType, Detail, PositionDetail, Reader, SaxEventType, SAXParser, Text} from "sax-wasm";
import {finished} from "node:stream/promises";
import fs from "node:fs/promises";
import {createRequire} from "node:module";
const require = createRequire(import.meta.url);

export interface SaxParserToJSON {
	openStart: PositionDetail;
	openEnd: PositionDetail;
	closeStart: PositionDetail;
	closeEnd: PositionDetail;
	name: string;
	attributes: {
		name: Text;
		value: Text;
		type: AttributeType;
	}[];
	textNodes: {
		start: PositionDetail;
		end: PositionDetail;
		value: string;
	}[];
	selfClosing: boolean;
};

export function isSaxParserToJSON(tag: unknown): tag is SaxParserToJSON {
	const tagAsSaxParserToJSON = tag as SaxParserToJSON;
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
