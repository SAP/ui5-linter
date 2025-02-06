import ts from "typescript";
import {DecodedSourceMap, SourceMapInput, TraceMap, decodedMap, SourceMapSegment} from "@jridgewell/trace-mapping";

/**
 * Gets the original JS file and looks for specific properties that might eventually
 * contain XML content. Then search for the XML content and return it.
 */
export function extractXMLFromJs(filePath: string, fileContent: string) {
	const viewProps = ["definition", "fragmentContent", "viewContent"];
	if (viewProps.some((prop) => fileContent.includes(`${prop}:`))) {
		const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);

		const xmlContents: {xml: string; pos: ts.LineAndCharacter}[] = [];
		function findProperty(node: ts.Node) {
			if (ts.isObjectLiteralExpression(node)) {
				node.properties.forEach((prop) => {
					if (ts.isPropertyAssignment(prop) &&
						ts.isIdentifier(prop.name) &&
						ts.isStringLiteralLike(prop.initializer) &&
						viewProps.includes(prop.name.text)) {
						// TODO: Identify more correctly the prop:
						// "definition": ["create", "load", "sap.ui.view"],
						// "viewContent": ["sap.ui.xmlview", "sap.ui.view"],
						// "fragmentContent": ["sap.ui.fragment", "sap.ui.xmlfragment"],
						xmlContents.push({
							xml: prop.initializer.text,
							pos: sourceFile.getLineAndCharacterOfPosition(prop.initializer.pos),
						});
					}
				});
			}
			ts.forEachChild(node, findProperty);
		}

		findProperty(sourceFile);
		return xmlContents.map((xmlContent, idx) => ({
			originalPath: filePath,
			path: `${sourceFile.fileName.replace(/(\.js|\.ts)$/, "")}.inline-${idx + 1}.view.xml`,
			xmlSnippet: xmlContent ?? "",
		}));
	}
}

/**
 * Shifts the line and column indices of a source map.
 */
export function fixSourceMapIndices(map: SourceMapInput, lineShift = 0, columnShift = 0): DecodedSourceMap {
	const decodedTraceMap = decodedMap(new TraceMap(map));
	const {mappings} = decodedTraceMap;

	const newMappings = mappings.map((segment) =>
		segment.map(([genCol, srcIndex, origLine, origCol, nameIndex]) => {
			return (srcIndex !== undefined ?
					[genCol + columnShift, srcIndex, origLine! + lineShift, origCol! + columnShift, nameIndex] :
					[genCol + columnShift]) as SourceMapSegment;
		})
	);

	return {...decodedTraceMap, mappings: newMappings};
}
