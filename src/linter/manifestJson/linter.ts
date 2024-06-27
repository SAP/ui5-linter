import {Resource} from "@ui5/fs";
import ManifestLinter from "./ManifestLinter.js";
import {taskStart} from "../../utils/perf.js";
import {LinterParameters} from "../LinterContext.js";

export default async function lintJson({workspace, context}: LinterParameters) {
	const lintingDone = taskStart("Linting manifest.json files");

	let jsonResources: Resource[];

	const pathsToLint = context.getPathsToLint();
	if (pathsToLint?.length) {
		jsonResources = [];
		await Promise.all(pathsToLint.map(async (resourcePath) => {
			if (!resourcePath.endsWith("manifest.json") && !resourcePath.endsWith("manifest.appdescr_variant")) {
				return;
			}
			const resource = await workspace.byPath(resourcePath);
			if (!resource) {
				throw new Error(`Resource not found: ${resourcePath}`);
			}
			jsonResources.push(resource);
		}));
	} else {
		jsonResources = await workspace.byGlob("**/{manifest.json,manifest.appdescr_variant}");
	}
	await Promise.all(jsonResources.map(async (resource: Resource) => {
		const linter = new ManifestLinter(resource.getPath(), await resource.getString(), context);
		await linter.lint();
	}));
	lintingDone();
}
