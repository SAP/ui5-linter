import {LinterParameters} from "../LinterContext.js";
import transpileHtml from "./transpiler.js";
import {Resource} from "@ui5/fs";

export default async function lintHtml({workspace, context}: LinterParameters) {
	let htmlResources: Resource[];
	const pathsToLint = context.getPathsToLint();
	if (pathsToLint?.length) {
		htmlResources = [];
		await Promise.all(pathsToLint.map(async (resourcePath) => {
			if (!resourcePath.endsWith(".html")) {
				return;
			}
			const resource = await workspace.byPath(resourcePath);
			if (!resource) {
				throw new Error(`Resource not found: ${resourcePath}`);
			}
			htmlResources.push(resource);
		}));
	} else {
		htmlResources = await workspace.byGlob("**/*.html");
	}

	await Promise.all(htmlResources.map(async (resource: Resource) => {
		return transpileHtml(resource.getPath(), resource.getStream(), context);
	}));
}
