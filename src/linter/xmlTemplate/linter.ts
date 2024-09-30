import {Resource} from "@ui5/fs";
import {createResource} from "@ui5/fs/resourceFactory";
import transpileXml from "./transpiler.js";
import {LinterParameters} from "../LinterContext.js";

export default async function lintXml({filePathsWorkspace, workspace, context}: LinterParameters) {
	const xmlResources = await filePathsWorkspace.byGlob("**/{*.view.xml,*.fragment.xml}");

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

		await filePathsWorkspace.write(transpiledResource);
		await workspace.write(transpiledResource);
		await filePathsWorkspace.write(transpiledResourceSourceMap);
		await workspace.write(transpiledResourceSourceMap);
	}));
}
