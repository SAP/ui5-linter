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

export default async function lintFileTypes({filePathsReader, context}: LinterParameters) {
	const potentialDeprecatedResources =
			await filePathsReader.byGlob(`**/{${deprecatedViewFileTypes.map((type) => `*${type}`).join(",")}}`);

	potentialDeprecatedResources.forEach((resource: Resource) => {
		const fileSuffix = resource.getPath().split(".").pop()!.toUpperCase();
		context.addLintingMessage(resource.getPath(), MESSAGE.DEPRECATED_VIEW_TYPE, {viewType: fileSuffix});
	});
}
