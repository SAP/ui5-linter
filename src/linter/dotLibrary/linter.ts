import {LinterParameters} from "../LinterContext.js";
import DotLibraryLinter from "./DotLibraryLinter.js";
import {Resource} from "@ui5/fs";

export default async function lintDotLibrary({context, filePathsReader}: LinterParameters) {
	const dotLibraryResources = await filePathsReader.byGlob("**/.library");

	await Promise.all(dotLibraryResources.map(async (resource: Resource) => {
		const linter = new DotLibraryLinter(resource.getPath(), resource.getStream(), context);
		await linter.lint();
	}));
}
