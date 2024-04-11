import {LinterParameters} from "../LinterContext.js";
import transpileHtml from "./transpiler.js";
import {Resource} from "@ui5/fs";

export default async function lintHtml({workspace, context}: LinterParameters) {
	let htmlResources: Resource[];
	const filePaths = context.getFilePaths();
	if (filePaths?.length) {
		htmlResources = [];
		await Promise.all(filePaths.map(async (filePath) => {
			if (!filePath.endsWith(".html")) {
				return;
			}
			const resource = await workspace.byPath(filePath);
			if (!resource) {
				throw new Error(`Resource not found: ${filePath}`);
			}
			htmlResources.push(resource);
		}));
	} else {
		htmlResources = await workspace.byGlob("**/{*.html}");
	}

	await Promise.all(htmlResources.map(async (resource: Resource) => {
		return transpileHtml(resource.getPath(), resource.getStream(), context);
	}));
}
