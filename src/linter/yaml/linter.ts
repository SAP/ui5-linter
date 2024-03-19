import {LinterParameters} from "../LinterContext.js";
import UI5YamlLinter from "./UI5YamlLinter.js";
import {Resource} from "@ui5/fs";

export default async function lintUI5Yaml({context}: LinterParameters) {
	let ui5YamlResources: Resource[];
	const pathsToLint = context.getPathsToLint();
	const reader = context.getRootReader();
	if (pathsToLint?.length) {
		ui5YamlResources = [];
		await Promise.all(pathsToLint.map(async (resourcePath) => {
			if (!resourcePath.endsWith(".yaml")) {
				return;
			}
			const resource = await reader.byPath(resourcePath);
			if (!resource) {
				throw new Error(`Resource not found: ${resourcePath}`);
			}
			ui5YamlResources.push(resource);
		}));
	} else {
		ui5YamlResources = await reader.byGlob("/{ui5.yaml,*-ui5.yaml,*.ui5.yaml,ui5-*.yaml}");
	}

	await Promise.all(ui5YamlResources.map(async (resource: Resource) => {
		const linter = new UI5YamlLinter(resource.getPath(), await resource.getString(), context);
		await linter.lint();
	}));
}
