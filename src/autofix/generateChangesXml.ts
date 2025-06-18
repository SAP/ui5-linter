import {Resource} from "@ui5/fs";
import {Attribute, Position, SaxEventType, Tag} from "sax-wasm";
import {parseXml} from "../utils/xmlParser.js";
import Fix from "../linter/ui5Types/fix/Fix.js";
import XmlEnabledFix from "../linter/ui5Types/fix/XmlEnabledFix.js";
import {RawLintMessage} from "../linter/LinterContext.js";
import {ChangeSet} from "./autofix.js";
import {removeConflictingFixes} from "./utils.js";
// import {getLogger} from "@ui5/logger";

// const log = getLogger("linter:autofix:generateChangesXml");

interface NodeSearchInfo {
	position: Position;
	fix: XmlEnabledFix;
	xmlEventTypes: SaxEventType[];
}

export default async function generateChangesXml(
	messages: RawLintMessage[],
	changeSets: ChangeSet[], content: string, resource: Resource) {
	const lines = content.split("\n");

	const nodeSearchInfo = new Set<NodeSearchInfo>();
	let events = 0;

	// Collect all fixes from the messages
	for (const {fix} of messages) {
		if (!fix || !(fix instanceof XmlEnabledFix)) {
			continue;
		}
		// Map "position for search" (calculated from the transpiled AST using the source map) to the absolute
		// position in the XML file
		const {position: fixStart, xmlEventTypes} = fix.getNodeSearchParameters();
		if (!xmlEventTypes) {
			throw new Error(`Fix ${fix.constructor.name} does not provide xmlEventTypes for autofix`);
		}

		for (const eventType of xmlEventTypes) {
			events |= eventType;
		}

		nodeSearchInfo.add({
			fix,
			xmlEventTypes,
			position: {
				line: fixStart.line - 1, // Convert to 0-based line
				character: fixStart.column - 1, // Convert to 0-based column
			},
		});
	}

	const toPositionCallback = function (pos: Position) {
		return toPosition(pos, lines);
	};

	const matchedFixes = new Set<Fix>();
	await parseXml(resource.getStream(), (event, data) => {
		if (data instanceof Tag) {
			if (event === SaxEventType.OpenTag) {
				for (const {position, fix, xmlEventTypes} of nodeSearchInfo) {
					if (xmlEventTypes.includes(SaxEventType.OpenTag)) {
						if (data.openStart.line === position.line && data.openStart.character === position.character) {
							fix.visitAutofixXmlNode(data, toPositionCallback);
						}
					}
				}
			}
		} else if (data instanceof Attribute) {
			for (const nodeInfo of nodeSearchInfo) {
				const {position, fix, xmlEventTypes} = nodeInfo;
				if (xmlEventTypes.includes(event)) {
					if (data.name.start.line === position.line && data.name.start.character === position.character &&
						fix.visitAutofixXmlNode(data, toPositionCallback)) {
						matchedFixes.add(fix);
						nodeSearchInfo.delete(nodeInfo);
					}
				}
			}
		}
	}, events);

	removeConflictingFixes(matchedFixes);

	// TBD: Collect dependencies etc.

	for (const fix of matchedFixes) {
		const changes = fix.generateChanges();
		if (!changes) {
			// No changes generated, skip this fix
			continue;
		}
		if (Array.isArray(changes)) {
			for (const change of changes) {
				changeSets.push(change);
			}
		} else {
			changeSets.push(changes);
		}
	}
}

function toPosition(position: Position, lines: string[]) {
	let pos: number;
	if (position.line === 0) {
		pos = position.character;
	} else {
		pos = 0;
		for (let i = 0; i < position.line; i++) {
			pos += lines[i].length + 1; // +1 for the newline character we used to split the lines with
		}
		pos += position.character;
	}
	return pos;
}
