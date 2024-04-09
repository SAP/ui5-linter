import {Resource} from "@ui5/fs";
import {createResource} from "@ui5/fs/resourceFactory";
import transpileXml from "./transpiler.js";
import {LinterParameters} from "../LinterContext.js";

export default async function lintXml({workspace, context}: LinterParameters) {
	let xmlResources: Resource[];
	const filePaths = context.getFilePaths();
	if (filePaths?.length) {
		xmlResources = [];
		await Promise.all(filePaths.map(async (filePath) => {
			if (!filePath.endsWith(".view.xml") && !filePath.endsWith(".fragment.xml")) {
				return;
			}
			const resource = await workspace.byPath(filePath);
			if (!resource) {
				throw new Error(`Resource not found: ${filePath}`);
			}
			xmlResources.push(resource);
		}));
	} else {
		xmlResources = await workspace.byGlob("**/{*.view.xml,*.fragment.xml}");
	}

	await Promise.all(xmlResources.map(async (resource: Resource) => {
		const {source, map} = await transpileXml(resource.getPath(), resource.getStream(), context);
		const resourcePath = resource.getPath();

		// Write transpiled resource to workspace
		// TODO: suffix name to prevent clashes with existing files?
		const jsPath = resourcePath.replace(/\.xml$/, ".js");
		context.addFilePathToLint(jsPath);
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
