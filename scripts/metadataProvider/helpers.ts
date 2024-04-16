import {mkdir, unlink, readdir} from "node:fs/promises";
import {createWriteStream} from "node:fs";
import https from "node:https";
import {pipeline} from "node:stream/promises";
import path from "node:path";
import yauzl from "yauzl-promise";

export const RAW_API_JSON_FILES_FOLDER = "tmp/apiJson";

export async function fetchAndExtractAPIJsons(url: string) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Unexpected response ${response.statusText}`);
	}

	if (response.body && response.body instanceof ReadableStream) {
		const zipFileName: string = url.split("/").pop()!;
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

		// Remove the ZIP file, so that the folder will contain only JSON files
		await unlink(zipFile);
	} else {
		throw new Error(`The request to "${url}" returned a malformed response and cannot be read.`);
	}
}

export async function cleanup() {
	const apiJsonList = await readdir(RAW_API_JSON_FILES_FOLDER);

	await Promise.all(apiJsonList.map((library) => unlink(path.resolve(RAW_API_JSON_FILES_FOLDER, library))));
}

export async function handleCli(cb: (url: string, sapui5Version: string) => Promise<void>) {
	try {
		const url = process.argv[2];
		let sapui5Version: string | null | undefined = process.argv[3];

		if (!url) {
			throw new Error("First argument \"url\" is missing");
		}

		if (!sapui5Version) {
			// Try to extract version from url
			const versionMatch = url.match(/\/\d{1}\.\d{1,3}\.\d{1,3}\//gi);
			sapui5Version = versionMatch?.[0].replaceAll("/", "");
		}
		if (!sapui5Version) {
			throw new Error("\"sapui5Version\" cannot be determined. Provide it as a second argument");
		}

		await cb(url, sapui5Version);
	} catch (err) {
		process.stderr.write(String(err));
		process.exit(1);
	}
}
