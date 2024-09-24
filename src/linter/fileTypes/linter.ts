import {Resource} from "@ui5/fs";
import {LinterParameters} from "../LinterContext.js";
import {MESSAGE} from "../messages.js";

export default async function lintFileTypes({workspace, context}: LinterParameters) {
	let xmlResources: Resource[];
	const pathsToLint = context.getPathsToLint();
	if (pathsToLint?.length) {
		// TODO: Refactor to utiliize reuse
		xmlResources = [];
		await Promise.all(pathsToLint.map(async (resourcePath) => {
			if (!resourcePath.endsWith(".view.json") && !resourcePath.endsWith(".view.html") &&
				!resourcePath.endsWith(".view.js") && !resourcePath.endsWith(".view.tmpl") &&
				!resourcePath.endsWith(".view.ts") && !resourcePath.endsWith(".fragment.html") &&
				!resourcePath.endsWith(".fragment.js") && !resourcePath.endsWith(".fragment.ts")
			) {
				return;
			}
			const resource = await workspace.byPath(resourcePath);
			if (!resource) {
				throw new Error(`Resource not found: ${resourcePath}`);
			}
			xmlResources.push(resource);
		}));
	} else {
		xmlResources = await workspace.byGlob("**/{*.view.json,*.view.html,*.view.js,*.view.tmpl,*.view.ts,*.fragment.html,*.fragment.js,*fragment.ts}");
	}

	xmlResources.forEach((resource: Resource) => {
		const fileSuffix = resource.getPath().split(".").pop()!.toUpperCase();
		context.addLintingMessage(resource.getPath(), MESSAGE.DEPRECATED_VIEW_TYPE, {fileSuffix});
	});
}
