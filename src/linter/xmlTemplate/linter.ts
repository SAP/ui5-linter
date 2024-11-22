import {Resource} from "@ui5/fs";
import {createResource} from "@ui5/fs/resourceFactory";
import transpileXml from "./transpiler.js";
import {LinterParameters} from "../LinterContext.js";
import ControllerByIdInfo from "./ControllerByIdInfo.js";
import {ControllerByIdDtsGenerator} from "./generator/ControllerByIdDtsGenerator.js";

export default async function lintXml({filePathsWorkspace, workspace, context}: LinterParameters) {
	const xmlResources = await filePathsWorkspace.byGlob("**/{*.view.xml,*.fragment.xml}");

	const controllerByIdInfo = new ControllerByIdInfo();

	await Promise.all(xmlResources.map(async (resource: Resource) => {
		const res = await transpileXml(resource.getPath(), resource.getStream(), context, controllerByIdInfo);
		if (!res) {
			return;
		}
		const {source, map} = res;
		const resourcePath = resource.getPath();

		// Write transpiled resource to workspace
		// TODO: suffix name to prevent clashes with existing files?
		const jsPath = resourcePath.replace(/\.xml$/, ".js");
		const transpiledResource = createResource({
			path: jsPath,
			string: source,
		});
		const transpiledResourceSourceMap = createResource({
			path: jsPath + ".map",
			string: map,
		});

		await filePathsWorkspace.write(transpiledResource);
		await workspace.write(transpiledResource);
		await filePathsWorkspace.write(transpiledResourceSourceMap);
		await workspace.write(transpiledResourceSourceMap);
	}));

	// Generate dts file with specific byId signatures for controllers based on view IDs
	const controllerByIdDtsGenerator = new ControllerByIdDtsGenerator(controllerByIdInfo);
	const controllerByIdDts = controllerByIdDtsGenerator.generate();

	const dtsResource = createResource({
		path: "/types/@ui5/linter/virtual/ControllerById.d.ts",
		string: controllerByIdDts,
	});
	await workspace.write(dtsResource);
}
