import {Resource} from "@ui5/fs";
import {LinterParameters} from "../LinterContext.js";
import {MESSAGE} from "../messages.js";

const deprecatedViewFileTypes = [
	".view.json",
	".view.html",
	".view.js",
	".view.tmpl",
	".view.ts",
	".fragment.html",
	".fragment.js",
	".fragment.ts",
];

export default async function lintFileTypes({workspace, context}: LinterParameters) {
	let potentialDeprecatedResources: Resource[];
	const pathsToLint = context.getPathsToLint();
	if (pathsToLint?.length) {
		potentialDeprecatedResources = [];
		await Promise.all(pathsToLint.map(async (resourcePath) => {
			if (!deprecatedViewFileTypes.some((type) => resourcePath.endsWith(type))) {
				return;
			}
			const resource = await workspace.byPath(resourcePath);
			if (!resource) {
				throw new Error(`Resource not found: ${resourcePath}`);
			}
			potentialDeprecatedResources.push(resource);
		}));
	} else {
		potentialDeprecatedResources =
			await workspace.byGlob(`**/{${deprecatedViewFileTypes.map((type) => `*${type}`).join(",")}}`);
	}

	potentialDeprecatedResources.forEach((resource: Resource) => {
		const fileSuffix = resource.getPath().split(".").pop()!.toUpperCase();
		context.addLintingMessage(resource.getPath(), MESSAGE.DEPRECATED_VIEW_TYPE, {viewType: fileSuffix});
	});
}
