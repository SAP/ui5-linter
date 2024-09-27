import {LinterParameters} from "../LinterContext.js";
import DotLibraryLinter from "./DotLibraryLinter.js";
import {Resource} from "@ui5/fs";

export default async function lintDotLibrary({context, workspace}: LinterParameters) {
	const reader = context.getFilePathsReader() ?? workspace;
	const dotLibraryResources = await reader.byGlob("**/.library");

	await Promise.all(dotLibraryResources.map(async (resource: Resource) => {
		const linter = new DotLibraryLinter(resource.getPath(), resource.getStream(), context);
		await linter.lint();
	}));
}
