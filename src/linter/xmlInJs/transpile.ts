import ts from "typescript";
import {DecodedSourceMap, SourceMapInput, TraceMap, decodedMap} from "@jridgewell/trace-mapping";

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

export function fixSourceMapIndices(map: SourceMapInput, lineShift = 0, columnShift = 0): DecodedSourceMap {
	const newMappings = decodedMap(new TraceMap(map)).mappings.map((segment) =>
		segment.map(([genCol, srcIndex, origLine, origCol, nameIndex]) => {
			return srcIndex !== undefined ?
					[genCol + columnShift, srcIndex, origLine! + lineShift, origCol! + columnShift, nameIndex] :
					[genCol + columnShift]; // Only adjust generated column if no source mapping
		})
	);

	return {...map as object, mappings: newMappings};
}
