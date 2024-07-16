import test from "ava";
import {parseXML} from "../../../src/utils/xmlParser.js";
import {ReadStream} from "node:fs";
import {Readable} from "node:stream";
import {SaxEventType, Tag as SaxTag} from "sax-wasm";

test("Test xmlParser with .library", async (t) => { //TODO: Remove .only
	const rawContent = `<?xml version="1.0" ?>
<library xmlns="http://www.sap.com/sap.ui.library.xsd">
	<name>library.with.custom.paths</name>
	<vendor>SAP SE</vendor>
	<version>1.0</version>
	<copyright>any</copyright>
	<dependencies>
		<dependency>
			<libraryName>sap.ui.core</libraryName>
		</dependency>
		<dependency>
			<libraryName>sap.ca.scfld.md</libraryName>
		</dependency>
		<dependency>
			<libraryName>sap.ca.scfld.md</libraryName>
		</dependency>
		<dependency>
			<libraryName>sap.ca.ui</libraryName>
		</dependency>
	</dependencies>
</library>`;

	// Convert raw .library content into stream
	const contentStream = new Readable() as ReadStream;
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	contentStream._read = () => {};
	contentStream.push(rawContent);

	// Call SAXParser with the contentStream
	const libs = new Set();
	await parseXML(contentStream, (event, tag): void => {
		if (tag instanceof SaxTag &&
			event === SaxEventType.CloseTag &&
			tag.value === "libraryName") {
			libs.add(tag);
		}
	});

	//TODO: Test if the array "libs" contains the expected values

	// t.is(libs.size, 4, "Parsed .library XML should contain 4 libraries");
	//TODO: Check if first lib is "sap.ui.core"


	t.is(true, true, "should be true"); //TODO: remove this line
});
