import {createRequire} from "module";
import {writeFile, readdir} from "node:fs/promises";
import path from "node:path";
import MetadataProvider from "./MetadataProvider.js";
import {fetchAndExtractApiJsons, handleCli, cleanup, RAW_API_JSON_FILES_FOLDER} from "./helpers.js";

import type {UI5Enum, UI5EnumValue, UI5Namespace} from "@ui5-language-assistant/semantic-model-types";

const require = createRequire(import.meta.url);

async function getPseudoModuleNames() {
	const apiJsonList = await readdir(RAW_API_JSON_FILES_FOLDER);

	interface apiJson {
		symbols: {
			"ui5-metadata": {
				stereotype: string;
			};
			"name": string;
			"kind": string;
			"resource": string;
			"export": string;
		};
	}

	return apiJsonList.flatMap((library) => {
		const libApiJson = require(path.resolve(RAW_API_JSON_FILES_FOLDER, library)) as apiJson;
		return libApiJson.symbols;
	}).reduce((acc: Record<string, string>, symbol) => {
		if (["datatype", "enum"].includes(symbol?.["ui5-metadata"]?.stereotype) &&
			symbol.resource.endsWith("library.js")) {
			acc[symbol.name] = symbol.export ?? symbol.name;
		}

		return acc;
	}, Object.create(null) as Record<string, string>);
}

async function transformFiles(sapui5Version: string) {
	const metadataProvider = new MetadataProvider();
	const [, pseudoModuleNames] = await Promise.all([
		metadataProvider.init(RAW_API_JSON_FILES_FOLDER, sapui5Version),
		getPseudoModuleNames(),
	]);

	const {enums, namespaces: dataTypes} = metadataProvider.getModel();

	const groupedEnums = Object.keys({...enums, ...dataTypes})
		.reduce((acc: Record<string, {enum?: UI5Enum; dataType?: UI5Namespace; export: string}[]>, key: string) => {
			// Filter only real pseudo modules i.e. defined within library.js files
			if (!pseudoModuleNames[key]) {
				return acc;
			}

			const curEnum = enums[key];
			const curDataType = dataTypes[key];

			if (curEnum) {
				acc[curEnum.library] = acc[curEnum.library] ?? [];
				acc[curEnum.library].push(
					{enum: curEnum, export: pseudoModuleNames[key]});
			} else if (curDataType) {
				acc[curDataType.library] = acc[curDataType.library] ?? [];
				acc[curDataType.library].push(
					{dataType: curDataType, export: pseudoModuleNames[key]});
			}

			return acc;
		}, Object.create(null) as Record<string, {enum: UI5Enum; export: string}[]>);

	await addOverrides(groupedEnums);
}

function buildJSDoc(enumEntry: UI5Enum | UI5EnumValue, indent = "") {
	const jsDocBuilder: string[] = [`${indent}/**`];

	if (enumEntry.description) {
		jsDocBuilder.push(`${indent} * ${enumEntry.description.replaceAll("\n", "\n" + indent + " * ")}`);
		jsDocBuilder.push(`${indent} *`);
	}

	if (enumEntry.experimentalInfo) {
		let experimental = `${indent} * @experimental`;
		if (enumEntry.experimentalInfo.since) {
			experimental += ` (since ${enumEntry.experimentalInfo.since})`;
		}
		if (enumEntry.experimentalInfo.text) {
			experimental += ` - ${enumEntry.experimentalInfo.text}`;
		}
		jsDocBuilder.push(experimental);
	}

	if (enumEntry.deprecatedInfo) {
		let deprecated = `${indent} * @deprecated`;
		if (enumEntry.deprecatedInfo.since) {
			deprecated += ` (since ${enumEntry.deprecatedInfo.since})`;
		}
		if (enumEntry.deprecatedInfo.text) {
			deprecated += ` - ${enumEntry.deprecatedInfo.text}`;
		}
		jsDocBuilder.push(deprecated);
	}

	if (enumEntry.visibility) {
		jsDocBuilder.push(`${indent} * @${enumEntry.visibility}`);
	}

	if (enumEntry.since) {
		jsDocBuilder.push(`${indent} * @since ${enumEntry.since}`);
	}
	jsDocBuilder.push(`${indent}*/`);

	return jsDocBuilder.join("\n");
}

async function addOverrides(enums: Record<string, {enum?: UI5Enum; dataType?: UI5Namespace; export: string}[]>) {
	const indexFilesImports: string[] = [];

	for (const libName of Object.keys(enums)) {
		const enumEntries = enums[libName];
		const stringBuilder: string[] = [];

		enumEntries.forEach(({enum: enumEntry, dataType: dataTypeEntry, export: exportName}) => {
			if (enumEntry?.kind !== "UI5Enum" || dataTypeEntry?.kind !== "UI5Namespace") {
				return;
			}

			const exportNameChunks = exportName.split(".");
			const name = exportNameChunks[0]; // Always import the first chunk and then export the whole thing

			stringBuilder.push(`declare module "${libName.replaceAll(".", "/")}/${exportName.replaceAll(".", "/")}" {`);

			stringBuilder.push(`\timport {${name}} from "${libName.replaceAll(".", "/")}/library";`);
			stringBuilder.push("");
			stringBuilder.push(buildJSDoc(enumEntry ?? dataTypeEntry, "\t"));
			stringBuilder.push(`\texport default ${exportName};`);

			stringBuilder.push(`}`);
			stringBuilder.push("");

			return stringBuilder.join("\n");
		});

		indexFilesImports.push(`import "./${libName}";`);
		await writeFile(
			new URL(`../../resources/overrides/library/${libName}.d.ts`, import.meta.url),
			stringBuilder.join("\n")
		);
	}

	await writeFile(
		new URL(`../../resources/overrides/library/index.d.ts`, import.meta.url),
		indexFilesImports.join("\n") + "\n"
	);
}

// Entrypoint
await handleCli(async (url, sapui5Version) => {
	await fetchAndExtractApiJsons(url);

	await transformFiles(sapui5Version);

	await cleanup();
});
