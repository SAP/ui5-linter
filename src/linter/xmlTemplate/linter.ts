import {Resource} from "@ui5/fs";
import {createResource} from "@ui5/fs/resourceFactory";
import transpileXml from "./transpiler.js";
import {LinterParameters} from "../LinterContext.js";

export default async function lintXml({workspace, context}: LinterParameters) {
	let xmlResources: Resource[];
	const pathsToLint = context.getPathsToLint();
	if (pathsToLint?.length) {
		xmlResources = [];
		await Promise.all(pathsToLint.map(async (resourcePath) => {
			if (!resourcePath.endsWith(".view.xml") && !resourcePath.endsWith(".fragment.xml")) {
				return;
			}
			const resource = await workspace.byPath(resourcePath);
			if (!resource) {
				throw new Error(`Resource not found: ${resourcePath}`);
			}
			xmlResources.push(resource);
		}));
	} else {
		xmlResources = await workspace.byGlob("**/{*.view.xml,*.fragment.xml}");
	}

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
