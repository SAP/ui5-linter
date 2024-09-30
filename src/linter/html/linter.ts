import {LinterParameters} from "../LinterContext.js";
import transpileHtml from "./transpiler.js";
import {Resource} from "@ui5/fs";

export default async function lintHtml({filePathsWorkspace, context}: LinterParameters) {
	const htmlResources = await filePathsWorkspace.byGlob("**/*.html");

	await Promise.all(htmlResources.map(async (resource: Resource) => {
		return transpileHtml(resource.getPath(), resource.getStream(), context);
	}));
}
