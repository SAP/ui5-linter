import {LinterParameters} from "../LinterContext.js";
import DotLibraryLinter from "./DotLibraryLinter.js";
import {Resource} from "@ui5/fs";

export default async function lintDotLibrary({context, workspace}: LinterParameters) {
	let dotLibraryResources: Resource[];
	const pathsToLint = context.getPathsToLint();
	if (pathsToLint?.length) {
		dotLibraryResources = [];
		await Promise.all(pathsToLint.map(async (resourcePath) => {
			if (!resourcePath.endsWith(".library")) {
				return;
			}
			const resource = await workspace.byPath(resourcePath);
			if (!resource) {
				throw new Error(`Resource not found: ${resourcePath}`);
			}
			dotLibraryResources.push(resource);
		}));
	} else {
		dotLibraryResources = await workspace.byGlob("**/.library");
	}

	await Promise.all(dotLibraryResources.map(async (resource: Resource) => {
		const linter = new DotLibraryLinter(resource.getPath(), resource.getStream(), context);
		await linter.lint();
	}));
}
