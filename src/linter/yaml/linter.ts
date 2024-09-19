import {LinterParameters} from "../LinterContext.js";
import YamlLinter from "./YamlLinter.js";
import {Resource} from "@ui5/fs";

export default async function lintUI5Yaml({context}: LinterParameters) {
	const reader = context.getRootReader();
	const ui5YamlResources = await reader.byGlob("/{ui5.yaml,*-ui5.yaml,*.ui5.yaml,ui5-*.yaml}");

	await Promise.all(ui5YamlResources.map(async (resource: Resource) => {
		const linter = new YamlLinter(resource.getPath(), await resource.getString(), context);
		await linter.lint();
	}));
}
