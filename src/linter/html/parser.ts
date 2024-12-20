import type {ReadStream} from "node:fs";
import {SaxEventType, Tag as SaxTag} from "sax-wasm";
import {parseXML} from "../../utils/xmlParser.js";

interface ExtractedTags {
	scriptTags: SaxTag[];
	stylesheetLinkTags: SaxTag[];
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
		if (event === SaxEventType.OpenTag &&
			tag.value === "link") {
			if (tag.attributes.some((attr) => {
				return (attr.name.value === "rel" &&
					attr.value.value === "stylesheet");
			})) {
				extractedTags.stylesheetLinkTags.push(tag);
			};
		} else if (event === SaxEventType.CloseTag &&
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
				extractedTags.scriptTags.push(tag);
			}
		}
	});
	return extractedTags;
}
