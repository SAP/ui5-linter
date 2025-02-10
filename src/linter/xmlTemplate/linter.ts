import {Resource} from "@ui5/fs";
import {createResource} from "@ui5/fs/resourceFactory";
import transpileXml from "./transpiler.js";
import {LinterParameters} from "../LinterContext.js";
import ControllerByIdInfo from "./ControllerByIdInfo.js";
import {ControllerByIdDtsGenerator} from "./generator/ControllerByIdDtsGenerator.js";
import {decodedMap, DecodedSourceMap, SourceMapInput, TraceMap} from "@jridgewell/trace-mapping";

// For usage in TypeLinter to write the file as part of the internal WRITE_TRANSFORMED_SOURCES debug mode
export const CONTROLLER_BY_ID_DTS_PATH = "/types/@ui5/linter/virtual/ControllerById.d.ts";

export default async function lintXml({filePathsWorkspace, workspace, context}: LinterParameters) {
	const xmlResources = await filePathsWorkspace.byGlob("**/{*.view.xml,*.fragment.xml}");

	const controllerByIdInfo = new ControllerByIdInfo();

	await Promise.all(xmlResources.map(async (resource: Resource) => {
		const resourcePath = resource.getPath();
		const jsPath = resourcePath.replace(/\.xml$/, ".js");
		const contextMeta = context.getMetadata(jsPath);
		// This resource has already been transpiled & linted, so no need for duplicate linting
		if (contextMeta.xmlCompiledResource) {
			return;
		}

		const res = await transpileXml(resource.getPath(), resource.getStream(), context, controllerByIdInfo);
		if (!res) {
			return;
		}
		const {source, map} = res;

		let xmlFromJsResourceMap;
		const metadata = context.getMetadata(resourcePath);
		if (metadata.jsToXmlPosMapping) {
			xmlFromJsResourceMap = JSON.parse(map) as DecodedSourceMap;
			const {pos} = metadata.jsToXmlPosMapping;
			// If it's an XML snippet extracted from a JS file, adjust the source map positions
			// as these positions are relative to the extracted string, not to the real position in the JS file.
			// Add that missing line shift from the original JS file to the source map.
			xmlFromJsResourceMap = fixSourceMapIndices(xmlFromJsResourceMap, pos.line);
			// Replace the name of the source file in the source map with the original JS file name,
			// so that reporter will lead to the original source file.
			xmlFromJsResourceMap.sources.splice(0, 1, metadata.jsToXmlPosMapping.originalPath.split("/").pop() ?? null);
		}

		// Write transpiled resource to workspace
		// TODO: suffix name to prevent clashes with existing files?
		const transpiledResource = createResource({
			path: jsPath,
			string: source,
		});
		const transpiledResourceSourceMap = createResource({
			path: jsPath + ".map",
			string: xmlFromJsResourceMap ? JSON.stringify(xmlFromJsResourceMap) : map,
		});

		await filePathsWorkspace.write(transpiledResource);
		await workspace.write(transpiledResource);
		await filePathsWorkspace.write(transpiledResourceSourceMap);
		await workspace.write(transpiledResourceSourceMap);

		// Stash information that this .js file is actually a transpiled XML.
		contextMeta.xmlCompiledResource = resourcePath;
	}));

	// Generate dts file with specific byId signatures for controllers based on view IDs
	const controllerByIdDtsGenerator = new ControllerByIdDtsGenerator();
	const controllerByIdDts = controllerByIdDtsGenerator.generate(controllerByIdInfo);
	if (controllerByIdDts) {
		const dtsResource = createResource({
			path: CONTROLLER_BY_ID_DTS_PATH,
			string: controllerByIdDts,
		});
		await workspace.write(dtsResource);
	}
}

function fixSourceMapIndices(map: SourceMapInput, lineShift = 0, columnShift = 0): DecodedSourceMap {
	const decodedTraceMap = decodedMap(new TraceMap(map));
	const {mappings} = decodedTraceMap;

	const newMappings = mappings.map((segment) =>
		segment.map(([genCol, srcIndex, origLine, origCol, nameIndex]) => {
			return (srcIndex !== undefined ?
					[genCol + columnShift, srcIndex, origLine! + lineShift, origCol! + columnShift, nameIndex ?? 0] :
					[genCol + columnShift]);
		})
	);

	return {...decodedTraceMap, mappings: newMappings as DecodedSourceMap["mappings"]};
}
