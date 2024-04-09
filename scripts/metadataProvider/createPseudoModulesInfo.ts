import {pipeline} from "node:stream/promises";
import https from "node:https";
import yauzl from "yauzl-promise";
import path from "node:path";
import MetadataProvider from "./MetadataProvider.js";
import {writeFile, readdir, mkdir, unlink} from "node:fs/promises";
import {createWriteStream} from "node:fs";
import {createRequire} from "module";
const require = createRequire(import.meta.url);

import type {UI5Enum, UI5EnumValue} from "@ui5-language-assistant/semantic-model-types";

const RAW_API_JSON_FILES_FOLDER = "tmp/apiJson";

async function fetchAndExtractAPIJsons(url: string) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`unexpected response ${response.statusText}`);
	}

	if (response.body && response.body instanceof ReadableStream) {
		const zipFileName: string = url.split("/").pop() ?? "";
		const zipFile = path.resolve(RAW_API_JSON_FILES_FOLDER, zipFileName);
		await mkdir(path.resolve(RAW_API_JSON_FILES_FOLDER), {recursive: true});

		await new Promise((resolve) => {
			https.get(url, (res) => {
				resolve(pipeline(res, createWriteStream(zipFile)));
			});
		});

		const zip = await yauzl.open(zipFile);
		try {
			for await (const entry of zip) {
				if (entry.filename.endsWith("/")) {
					await mkdir(path.resolve(RAW_API_JSON_FILES_FOLDER, entry.filename));
				} else {
					const readEntry = await entry.openReadStream();
					const writeEntry = createWriteStream(path.resolve(RAW_API_JSON_FILES_FOLDER, entry.filename));
					await pipeline(readEntry, writeEntry);
				}
			}
		} finally {
			await zip.close();
		}

		// Cleanup the ZIP file, so that the folder will contain only JSON files
		await unlink(zipFile);
	} else {
		throw new Error("Malformed response");
	}
}

async function getPseudoModuleNames() {
	const apiJsonList = await readdir(RAW_API_JSON_FILES_FOLDER);

	interface apiJSON {
		symbols: {
			name: string;
			kind: string;
			resource: string;
		};
	}

	return apiJsonList.flatMap((library) => {
		const libApiJson = require(path.resolve(RAW_API_JSON_FILES_FOLDER, library)) as apiJSON;
		return libApiJson.symbols;
	}).reduce((acc: Record<string, boolean>, symbol) => {
		if (symbol.kind === "enum" && symbol.resource.endsWith("library.js")) {
			acc[symbol.name] = true;
		}

		return acc;
	}, Object.create(null) as Record<string, boolean>);
}

async function transformFiles(sapui5Version: string) {
	const metadataProvider = new MetadataProvider();
	const [, pseudoModuleNames] = await Promise.all([
		metadataProvider.init(RAW_API_JSON_FILES_FOLDER, sapui5Version),
		getPseudoModuleNames(),
	]);

	const {enums} = metadataProvider.getModel();

	const groupedEnums = Object.keys(enums).reduce((acc: Record<string, UI5Enum[]>, enumKey: string) => {
		// Filter only real pseudo modules i.e. defined within library.js files
		if (!pseudoModuleNames[enumKey]) {
			return acc;
		}

		const curEnum = enums[enumKey];

		acc[curEnum.library] = acc[curEnum.library] ?? [];
		acc[curEnum.library].push(curEnum);

		return acc;
	}, Object.create(null) as Record<string, UI5Enum[]>);

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

async function addOverrides(enums: Record<string, UI5Enum[]>) {
	const indexFilesImports: string[] = [];

	for (const libName of Object.keys(enums)) {
		const enumEntries = enums[libName];
		const stringBuilder: string[] = [];

		enumEntries.forEach((enumEntry) => {
			if (enumEntry.kind !== "UI5Enum") {
				return;
			}

			stringBuilder.push(`declare module "${libName.replaceAll(".", "/")}/${enumEntry.name}" {`);

			stringBuilder.push(`\timport ${enumEntry.name} from "${libName.replaceAll(".", "/")}/library";`);
			stringBuilder.push("");
			stringBuilder.push(buildJSDoc(enumEntry, "\t"));
			stringBuilder.push(`\texport default ${enumEntry.name};`);

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
		indexFilesImports.join("\n")
	);
}

async function main(url: string, sapui5Version: string) {
	await fetchAndExtractAPIJsons(url);

	await transformFiles(sapui5Version);
}

try {
	const url = process.argv[2];
	let sapui5Version: string | null | undefined = process.argv[3];

	if (!url) {
		throw new Error("second argument \"url\" is missing");
	}

	if (!sapui5Version) {
		// Try to extract version from url
		const versionMatch = url.match(/\/\d{1}\.\d{1,3}\.\d{1,3}\//gi);
		sapui5Version = versionMatch?.[0].replaceAll("/", "");
	}
	if (!sapui5Version) {
		throw new Error("\"sapui5Version\" cannot be determined. Provide it as a second argument");
	}

	await main(url, sapui5Version);
} catch (err) {
	process.stderr.write(String(err));
	process.exit(1);
}
