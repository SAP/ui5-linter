import {Resource} from "@ui5/fs";
import ManifestLinter from "./ManifestLinter.js";
import {taskStart} from "../../utils/perf.js";
import {LinterParameters} from "../LinterContext.js";

export default async function lintJson({workspace, filePathsReader, context}: LinterParameters) {
	const lintingDone = taskStart("Linting manifest.json files");
	const reader = filePathsReader ?? workspace;
	const jsonResources = await reader.byGlob("**/{manifest.json,manifest.appdescr_variant}");

	await Promise.all(jsonResources.map(async (resource: Resource) => {
		const linter = new ManifestLinter(resource.getPath(), await resource.getString(), context);
		await linter.lint();
	}));
	lintingDone();
}
