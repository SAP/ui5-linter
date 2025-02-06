import {Resource} from "@ui5/fs";
import {createResource} from "@ui5/fs/resourceFactory";
import transpileXml from "./transpiler.js";
import {LinterParameters} from "../LinterContext.js";
import ControllerByIdInfo from "./ControllerByIdInfo.js";
import {ControllerByIdDtsGenerator} from "./generator/ControllerByIdDtsGenerator.js";
import {extractXMLFromJs, fixSourceMapIndices} from "../xmlInJs/transpile.js";
import {type SourceMapInput} from "@jridgewell/trace-mapping";

// For usage in TypeLinter to write the file as part of the internal WRITE_TRANSFORMED_SOURCES debug mode
export const CONTROLLER_BY_ID_DTS_PATH = "/types/@ui5/linter/virtual/ControllerById.d.ts";

export default async function lintXml({filePathsWorkspace, workspace, context}: LinterParameters) {
	const jsTsResources = await Promise.all((await filePathsWorkspace.byGlob("**/*.{js,ts}"))
		.map(async (resource) => extractXMLFromJs(resource.getPath(), await resource.getString())));

	const xmlFromJsResources = jsTsResources
		.flatMap((res) => res).filter((resource) => !!resource?.xmlSnippet.xml);

	await Promise.all(xmlFromJsResources.map((resource) =>
		filePathsWorkspace.write(createResource({
			path: resource!.path,
			string: resource!.xmlSnippet.xml,
		}))));

	const xmlResources = await filePathsWorkspace.byGlob("**/{*.view.xml,*.fragment.xml}");

	const controllerByIdInfo = new ControllerByIdInfo();

	await Promise.all(xmlResources.map(async (resource: Resource) => {
		const res = await transpileXml(resource.getPath(), resource.getStream(), context, controllerByIdInfo);
		if (!res) {
			return;
		}
		const {source, map} = res;
		const resourcePath = resource.getPath();

		const xmlFromJsResource = xmlFromJsResources.find((res) => res!.path === resourcePath);
		let xmlFromJsResourceMap;
		if (xmlFromJsResource?.originalPath) {
			xmlFromJsResourceMap = JSON.parse(map) as SourceMapInput;
			const {pos} = xmlFromJsResource.xmlSnippet;
			xmlFromJsResourceMap = fixSourceMapIndices(xmlFromJsResourceMap, pos.line);
			xmlFromJsResourceMap.sources.splice(0, 1, xmlFromJsResource.originalPath.split("/").pop() ?? null);
		}

		// Write transpiled resource to workspace
		// TODO: suffix name to prevent clashes with existing files?
		const jsPath = resourcePath.replace(/\.xml$/, ".js");
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
		const contextMeta = context.getMetadata(jsPath);
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
