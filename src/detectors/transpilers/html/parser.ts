import type {ReadStream} from "node:fs";
import {Detail, SaxEventType, SAXParser, Tag as SaxTag} from "sax-wasm";
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

async function parseHtml(contentStream: ReadStream, parseHandler: (type: SaxEventType, tag: Detail) => void) {
	const options = {highWaterMark: 32 * 1024}; // 32k chunks
	const saxWasmBuffer = await initSaxWasm();
	const saxParser = new SAXParser(SaxEventType.CloseTag, options);

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

export async function extractJSScriptTags(contentStream: ReadStream) {
	const scriptTags: SaxTag[] = [];

	await parseHtml(contentStream, (event, tag) => {
		if (tag instanceof SaxTag &&
			event === SaxEventType.CloseTag &&
			tag.value === "script") {
			const isJSScriptTag = tag.attributes.every((attr) => {
				// The "type" attribute of the script tag should be
				// 1. not set (default),
				// 2. an empty string,
				// 3. or a JavaScript MIME type (text/javascript)
				// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type#attribute_is_not_set_default_an_empty_string_or_a_javascript_mime_type
				return attr.name.value !== "type" ||
					(attr.name.value === "type" &&
					["",
						"module",
						"text/javascript",
						"application/javascript", /* legacy */
					].includes(attr.value.value.toLowerCase()));
			});

			if (isJSScriptTag) {
				scriptTags.push(tag);
			}
		}
	});

	return scriptTags;
}
