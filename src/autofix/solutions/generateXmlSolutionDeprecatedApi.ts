import {Resource} from "@ui5/fs";
import {Attribute, Position, SaxEventType} from "sax-wasm";
import {RawLintMessage} from "../../linter/LinterContext.js";
import {MESSAGE} from "../../linter/messages.js";
import {parseXml} from "../../utils/xmlParser.js";
import {ChangeAction, ChangeSet} from "../autofix.js";
// import {getLogger} from "@ui5/logger";

// const log = getLogger("linter:autofix:generateXmlSolutionDeprecatedApi");

export default async function generateXmlSolutionDeprecatedApi(
	messages: RawLintMessage<MESSAGE.DEPRECATED_PROPERTY_OF_CLASS>[],
	changeSet: ChangeSet[], content: string, resource: Resource) {
	function toPosition(position: Position) {
		let pos: number;
		if (position.line === 0) {
			pos = position.character;
		} else {
			pos = 0;
			const lines = content.split("\n");
			for (let i = 0; i < position.line; i++) {
				pos += lines[i].length + 1; // +1 for the newline character we used to split the lines with
			}
			pos += position.character;
		}
		return pos;
	}

	function handleAttribute(attr: Attribute) {
		// Check whether line and column match with any of the messages
		const line = attr.name.start.line + 1;
		const column = attr.name.start.character + 1;
		const message = messages.find((message) => {
			return message.position?.line === line && message.position?.column === column;
		});
		if (!message?.fixHints) {
			return;
		}

		const {classProperty, classPropertyToBeUsed} = message.fixHints;

		if (classProperty === undefined || classPropertyToBeUsed === undefined) {
			return;
		}

		if (classPropertyToBeUsed) {
			changeSet.push({
				action: ChangeAction.REPLACE,
				start: toPosition(attr.name.start),
				end: toPosition(attr.name.end),
				value: classPropertyToBeUsed,
			});
		} else {
			changeSet.push({
				action: ChangeAction.DELETE,
				start: toPosition(attr.name.start),
				end: toPosition(attr.value.end) + 1,
			});
		}
	}

	await parseXml(resource.getStream(), (event, tag) => {
		if (event === SaxEventType.Attribute) {
			handleAttribute(tag as Attribute);
		}
	}, SaxEventType.Attribute);
}
