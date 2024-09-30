import {Resource} from "@ui5/fs";
import {createResource} from "@ui5/fs/resourceFactory";
import transpileXml from "./transpiler.js";
import {LinterParameters} from "../LinterContext.js";

export default async function lintXml({filePathsReader: filteredWorkspace, workspace, context}: LinterParameters) {
	const xmlResources = await filteredWorkspace.byGlob("**/{*.view.xml,*.fragment.xml}");

	await Promise.all(xmlResources.map(async (resource: Resource) => {
		const res = await transpileXml(resource.getPath(), resource.getStream(), context);
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

		await filteredWorkspace.write(transpiledResource);
		await workspace.write(transpiledResource);
		await filteredWorkspace.write(transpiledResourceSourceMap);
		await workspace.write(transpiledResourceSourceMap);
	}));
}
