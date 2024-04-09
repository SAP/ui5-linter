import {Resource} from "@ui5/fs";
import ManifestLinter from "./ManifestLinter.js";
import {taskStart} from "../../util/perf.js";
import {LinterParameters} from "../LinterContext.js";

export default async function lintJson({workspace, context}: LinterParameters) {
	const lintingDone = taskStart("Linting manifest.json files");

	let jsonResources: Resource[];

	const filePaths = context.getFilePaths();
	if (filePaths?.length) {
		jsonResources = [];
		await Promise.all(filePaths.map(async (filePath) => {
			if (!filePath.endsWith("manifest.json") && !filePath.endsWith("manifest.appdescr_variant")) {
				return;
			}
			const resource = await workspace.byPath(filePath);
			if (!resource) {
				throw new Error(`Resource not found: ${filePath}`);
			}
			jsonResources.push(resource);
		}));
	} else {
		jsonResources = await workspace.byGlob("**/{manifest.json,manifest.appdescr_variant}");
	}
	await Promise.all(jsonResources.map(async (resource: Resource) => {
		const linter = new ManifestLinter(await resource.getString(), resource.getPath(), context);
		await linter.lint();
	}));
	lintingDone();
}
