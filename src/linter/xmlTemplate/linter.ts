import {Resource} from "@ui5/fs";
import {createResource} from "@ui5/fs/resourceFactory";
import transpileXml from "./transpiler.js";
import {LinterParameters} from "../LinterContext.js";

export default async function lintXml({workspace, context}: LinterParameters) {
	const xmlResources = await workspace.byGlob("**/{*.view.xml,*.fragment.xml}");

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
		context.addPathToLint(jsPath);
		await workspace.write(createResource({
			path: jsPath,
			string: source,
		}));
		await workspace.write(createResource({
			path: jsPath + ".map",
			string: map,
		}));
	}));
}
