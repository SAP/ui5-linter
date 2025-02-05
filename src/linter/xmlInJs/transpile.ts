import ts from "typescript";

export function extractXMLFromJs(filePath: string, fileContent: string) {
	// TODO: Get the TS config from the main project
	const compilerOptions: ts.CompilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ESNext,
		inlineSourceMap: true,
		inlineSources: true,
	};

	const viewProps = ["definition", "fragmentContent", "viewContent"];
	if (viewProps.some((prop) => fileContent.includes(`${prop}:`))) {
		const output = ts.transpileModule(fileContent, {compilerOptions});

		const inlineSourceMapMatch = output.outputText.match(/\/\/# sourceMappingURL=data:application\/json;base64,([\w+/=]+)/);
		if (!inlineSourceMapMatch) {
			return;
		}

		const base64Map = inlineSourceMapMatch[1];
		const decodedMap = JSON.parse(Buffer.from(base64Map, "base64").toString("utf8")) as string;

		// TODO: Get the TS config from the main project
		const sourceFile = ts.createSourceFile(filePath, output.outputText, ts.ScriptTarget.Latest, true);

		const xmlContents: string[] = [];
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
						xmlContents.push(prop.initializer.text);
					}
				});
			}
			ts.forEachChild(node, findProperty);
		}

		findProperty(sourceFile);
		return xmlContents.map((xmlContent) => ({
			path: `${sourceFile.fileName.replace(/(\.js|\.ts)$/, "")}.inline-<n>.view.xml`,
			string: xmlContent ?? "",
			map: decodedMap,
		}));
	}
}
