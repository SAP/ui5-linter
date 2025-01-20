import type {ReadStream} from "node:fs";
import {SaxEventType, Tag as SaxTag} from "sax-wasm";
import {parseXML, SaxParserToJSON} from "../../utils/xmlParser.js";

interface ExtractedTags {
	scriptTags: SaxParserToJSON[];
	stylesheetLinkTags: SaxParserToJSON[];
}

export async function extractHTMLTags(contentStream: ReadStream) {
	const extractedTags: ExtractedTags = {
		scriptTags: [],
		stylesheetLinkTags: [],
	};
	await parseXML(contentStream, (event, tag) => {
		if (!(tag instanceof SaxTag)) {
			return;
		}
		const serializedTag = tag.toJSON() as SaxParserToJSON;
		if (event === SaxEventType.OpenTag &&
			serializedTag.name === "link") {
			if (serializedTag.attributes.some((attr) => {
				return (attr.name.value === "rel" &&
					attr.value.value === "stylesheet");
			})) {
				extractedTags.stylesheetLinkTags.push(serializedTag);
			};
		} else if (event === SaxEventType.CloseTag &&
			serializedTag.name === "script") {
			const isJSScriptTag = serializedTag.attributes.every((attr) => {
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
				extractedTags.scriptTags.push(serializedTag);
			}
		}
	});
	return extractedTags;
}
