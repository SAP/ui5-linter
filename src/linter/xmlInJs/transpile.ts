import ts from "typescript";
import {DecodedSourceMap, SourceMapInput, TraceMap, decodedMap, SourceMapSegment} from "@jridgewell/trace-mapping";
import {taskStart} from "../../utils/perf.js";

// Function to extract imports
function getRawUI5AmdImports(sourceFile: ts.SourceFile) {
	const imports: {module: string; specifiers: string[]}[] = [];


	return imports;
}

function zzzz(sourceFile: ts.SourceFile, node: ts.Node, methodName: string) {
	const mainNode = node.parent.parent;

	if (!ts.isCallExpression(mainNode)) {
		return false;
	}

	const nameChunks = [];
	let nameTraversalNode = mainNode.expression;
	while (ts.isPropertyAccessExpression(nameTraversalNode)) {
		nameChunks.unshift(nameTraversalNode.name.text);
		nameTraversalNode = nameTraversalNode.expression;
	}

	let potentialGlobalName;
	if (ts.isIdentifier(nameTraversalNode)) {
		potentialGlobalName = nameTraversalNode.text;
		nameChunks.unshift(potentialGlobalName);
	}

	// TODO: Identify more correctly the prop:
	// "definition": ["create", "load", "sap.ui.view"],
	// "viewContent": ["sap.ui.xmlview", "sap.ui.view"],
	// "fragmentContent": ["sap.ui.fragment", "sap.ui.xmlfragment"],

	if (!potentialGlobalName) {
		return false;
	}

	const name = nameChunks.join(".");
	if ((methodName === "definition" && ["sap.ui.view"].includes(name)) ||
		(methodName === "viewContent" && ["sap.ui.xmlview", "sap.ui.view"].includes(name)) ||
		(methodName === "fragmentContent" && ["sap.ui.fragment", "sap.ui.xmlfragment"].includes(name))) {
		return true;
	} else if (methodName === "definition" && ["create", "load"].includes(nameChunks[nameChunks.length - 1])) {
		const imports = getRawUI5AmdImports(sourceFile);

		// return
	}


	return false;
}

/**
 * Gets the original JS file and looks for specific properties that might eventually
 * contain XML content. Then search for the XML content and return it.
 */
export function extractXMLFromJs(filePath: string, fileContent: string) {
	const viewProps = ["definition", "fragmentContent", "viewContent"];
	if (viewProps.some((prop) => fileContent.includes(`${prop}:`))) {
		const taskEnd = taskStart("Extract XML snippet from", filePath, true);
		const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);

		const xmlContents: {xml: string; pos: ts.LineAndCharacter}[] = [];
		function findProperty(node: ts.Node) {
			if (ts.isObjectLiteralExpression(node)) {
				node.properties.forEach((prop) => {
					if (ts.isPropertyAssignment(prop) &&
						ts.isIdentifier(prop.name) &&
						ts.isStringLiteralLike(prop.initializer) &&
						viewProps.includes(prop.name.text)) {
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
		taskEnd();

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
