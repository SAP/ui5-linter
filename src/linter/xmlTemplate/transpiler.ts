import {SaxEventType, Tag as SaxTag} from "sax-wasm";
import {ReadStream} from "node:fs";
import {taskStart} from "../../utils/perf.js";
import LinterContext, {TranspileResult} from "../LinterContext.js";
import Parser from "./Parser.js";
import {getLogger} from "@ui5/logger";
import {MESSAGE} from "../messages.js";
import {loadApiExtract} from "../../utils/ApiExtract.js";
import ControllerByIdInfo from "./ControllerByIdInfo.js";
import {parseXML} from "../../utils/xmlParser.js";

const log = getLogger("linter:xmlTemplate:transpiler");

const apiExtract = await loadApiExtract();

export default async function transpileXml(
	resourcePath: string, contentStream: ReadStream, context: LinterContext, controllerByIdInfo: ControllerByIdInfo
): Promise<TranspileResult | undefined> {
	try {
		const taskEnd = taskStart("Transpile XML", resourcePath, true);
		const res = await transpileXmlToJs(resourcePath, contentStream, context, controllerByIdInfo);
		taskEnd();
		if (!res.source) {
			log.verbose(`XML transpiler returned no result for ${resourcePath}`);
			return res;
		}
		return res;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		context.addLintingMessage(resourcePath, MESSAGE.PARSING_ERROR, {message});
	}
}

async function transpileXmlToJs(
	resourcePath: string, contentStream: ReadStream, context: LinterContext, controllerByIdInfo: ControllerByIdInfo
): Promise<TranspileResult> {
	const parser = new Parser(resourcePath, apiExtract, context, controllerByIdInfo);

	await parseXML(contentStream, (event, detail) => {
		if (detail instanceof SaxTag) {
			if (event === SaxEventType.OpenTag) {
				parser.pushTag(detail.toJSON() as SaxTag);
			} else if (event === SaxEventType.CloseTag) {
				parser.popTag(detail.toJSON() as SaxTag);
			}
		}
	});

	return parser.generate();
}
