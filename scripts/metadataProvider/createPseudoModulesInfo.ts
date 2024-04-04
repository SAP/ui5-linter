import {pipeline} from "node:stream/promises";
import {Extract} from "unzip-stream";
import MetadataProvider from "./MetadataProvider.js";
import {writeFile} from "node:fs/promises";

import type {UI5Enum} from "@ui5-language-assistant/semantic-model-types";

const RAW_API_JSON_FILES_FOLDER = "tmp/apiJson";

async function downloadAPIJsons(url: string) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`unexpected response ${response.statusText}`);
	}

	if (response.body && response.body instanceof ReadableStream) {
		await pipeline(response.body, Extract({path: RAW_API_JSON_FILES_FOLDER}));
	} else {
		throw new Error("Malformed response");
	}
}

async function transformFiles() {
	const metadataProvider = new MetadataProvider();
	await metadataProvider.init(RAW_API_JSON_FILES_FOLDER);
	
	const {enums} = metadataProvider.getModel();
	
	const groupedEnums = Object.keys(enums).reduce((acc: Record<string, UI5Enum[]>, enumKey: string) => {
		const curEnum = enums[enumKey];

		acc[curEnum.library] = acc[curEnum.library] ?? [];
		acc[curEnum.library].push(curEnum);
		
		return acc;
	}, Object.create(null));

	await addOverrides(groupedEnums);
}

async function addOverrides(enums: Record<string, UI5Enum[]>) {
	const indexFilesImports: string[] = [];
	const buildJSDoc = (enumEntry: UI5Enum, indent: string = "") => {
		const jsDocBuilder: string[] = [`${indent}/**`];
		
		if (enumEntry.description) {
			jsDocBuilder.push(`${indent} * ${enumEntry.description.replaceAll("\n", "\n" + indent + " * ")}`);
			jsDocBuilder.push(`${indent} *`);
		}

		if (enumEntry.experimentalInfo) {
			let experimental: string = `${indent} * @experimental`;
			if (enumEntry.experimentalInfo.since) {
				experimental += ` (since ${enumEntry.experimentalInfo.since})`;
			}
			if (enumEntry.experimentalInfo.text) {
				experimental += ` - ${enumEntry.experimentalInfo.text}`;
			}
			jsDocBuilder.push(experimental);
		}
		
		if (enumEntry.deprecatedInfo) {
			let deprecated: string = `${indent} * @deprecated`;
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
	
	Object.keys(enums).forEach(async (libName) => {
		const enumEntries = enums[libName];

		let stringBuilder: string[] = [
			`declare module "${libName.replaceAll(".", "/")}/library" {`
		];
		enumEntries.forEach((enumEntry) => {
			if (enumEntry.kind !== "UI5Enum") {
				return;
			}

			stringBuilder.push(buildJSDoc(enumEntry, "\t"));
			stringBuilder.push(`\texport enum ${enumEntry.name} {`);
			enumEntry.fields.forEach((value) => {
				stringBuilder.push(buildJSDoc(value, "\t\t"));
				stringBuilder.push(`\t\t${value.name} = "${value.name}",`);
			});
			stringBuilder.push(`\t}`);

			return stringBuilder.join("\n");
		});
		stringBuilder.push(`}`)

		indexFilesImports.push(`import "./${libName}";`);
		await writeFile(
			new URL(`../../resources/overrides/library/${libName}.d.ts`, import.meta.url),
			stringBuilder.join("\n")
		);
	});
	
	await writeFile(
		new URL(`../../resources/overrides/library/index.d.ts`, import.meta.url),
		indexFilesImports.join("\n")
	);
}

async function main(url: string) {
	await downloadAPIJsons(url);

	await transformFiles();
}

try {
	const url = process.argv[2];
	if (!url) {
		throw new Error("second argument \"url\" is missing");
	}
	await main(url);
} catch (err) {
	process.stderr.write(String(err));
	process.exit(1);
}
