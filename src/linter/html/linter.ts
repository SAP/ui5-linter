import {LinterParameters} from "../LinterContext.js";
import transpileHtml from "./transpiler.js";
import {Resource} from "@ui5/fs";

export default async function lintHtml({workspace, context}: LinterParameters) {
	const reader = context.getFilePathsReader() ?? workspace;
	const htmlResources = await reader.byGlob("**/*.html");

	await Promise.all(htmlResources.map(async (resource: Resource) => {
		return transpileHtml(resource.getPath(), resource.getStream(), context);
	}));
}
