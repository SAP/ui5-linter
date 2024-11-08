import {createRequire} from "module";
import {writeFile, readdir} from "node:fs/promises";
import path from "node:path";

interface apiJson {
	"ui5-metadata": {
		stereotype: string;
	};
	"description": string;
	"since": string;
	"visibility": string;
	"module": string;
	"name": string;
	"kind": string;
	"resource": string;
	"export": string;
	"experimental": {
		since?: string;
		text?: string;
	};
	"deprecated": {
		since?: string;
		text?: string;
	};
}

const require = createRequire(import.meta.url);

async function getPseudoModuleNames(apiJsonsRoot: string) {
	const apiJsonList = await readdir(apiJsonsRoot);

	return apiJsonList.flatMap((library) => {
		const libApiJson = require(path.join(apiJsonsRoot, library)) as {symbols: apiJson[]};
		return libApiJson.symbols;
	}).reduce((acc: Record<string, apiJson[]>, symbol) => {
		if ((["datatype", "enum"].includes(symbol?.["ui5-metadata"]?.stereotype) ||
			symbol.kind === "enum") && symbol.resource.endsWith("library.js")) {
			const libName = symbol.module.replace("/library", "").replaceAll("/", ".");
			acc[libName] = acc[libName] ?? [];
			acc[libName].push(symbol);
		}

		return acc;
	}, Object.create(null) as Record<string, apiJson[]>);
}

function buildJSDoc(entry: apiJson, indent = "") {
	const jsDocBuilder: string[] = [`${indent}/**`];

	if (entry.description) {
		jsDocBuilder.push(`${indent} * ${entry.description.replaceAll("\n", "\n" + indent + " * ")}`);
		jsDocBuilder.push(`${indent} *`);
	}

	if (entry.experimental) {
		let experimental = `${indent} * @experimental`;
		if (entry.experimental.since) {
			experimental += ` (since ${entry.experimental.since})`;
		}
		if (entry.experimental.text) {
			experimental += ` - ${entry.experimental.text}`;
		}
		jsDocBuilder.push(experimental);
	}

	if (entry.deprecated) {
		let deprecated = `${indent} * @deprecated`;
		if (entry.deprecated.since) {
			deprecated += ` (since ${entry.deprecated.since})`;
		}
		if (entry.deprecated.text) {
			deprecated += ` - ${entry.deprecated.text}`;
		}
		jsDocBuilder.push(deprecated);
	}

	if (entry.visibility) {
		jsDocBuilder.push(`${indent} * @${entry.visibility}`);
	}

	if (entry.since) {
		jsDocBuilder.push(`${indent} * @since ${entry.since}`);
	}
	jsDocBuilder.push(`${indent}*/`);

	return jsDocBuilder.join("\n");
}

async function addOverrides(ui5Types: Record<string, apiJson[]>) {
	const indexFilesImports: string[] = [];

	for (const libName of Object.keys(ui5Types)) {
		const pseudoModulesEntries = ui5Types[libName];
		const stringBuilder: string[] = [];

		pseudoModulesEntries.forEach((record: apiJson) => {
			const exportName = record.export ?? record.name;
			const exportNameChunks = exportName.split(".");
			const name = exportNameChunks[0]; // Always import the first chunk and then export the whole thing

			stringBuilder.push(`declare module "${libName.replaceAll(".", "/")}/${exportName.replaceAll(".", "/")}" {`);

			stringBuilder.push(`\timport {${name}} from "${libName.replaceAll(".", "/")}/library";`);
			stringBuilder.push("");
			stringBuilder.push(buildJSDoc(record, "\t"));
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

export default async function createPseudoModulesInfo(apiJsonsRoot: string) {
	const pseudoModules = await getPseudoModuleNames(apiJsonsRoot);
	await addOverrides(pseudoModules);
}
