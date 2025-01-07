import {mkdir, unlink, readdir} from "node:fs/promises";
import {createWriteStream} from "node:fs";
import {Readable} from "node:stream";
import {ReadableStream} from "node:stream/web";
import {finished, pipeline} from "node:stream/promises";
import path from "node:path";
import yauzl from "yauzl-promise";
import {fileURLToPath} from "node:url";

const RAW_API_JSON_FILES_FOLDER = fileURLToPath(new URL(`../../tmp/apiJson`, import.meta.url));

export async function fetchAndExtractApiJsons(url: string) {
	const response = await fetch(url);
	if (!response.ok) {
		if (response.status === 404) {
			throw new Error(`The requested version does not exist`);
		} else {
			throw new Error(`Unexpected response ${response.status}: ${response.statusText}`);
		}
	}

	if (response.body && response.body instanceof ReadableStream) {
		const zipFileName: string = url.split("/").pop()!;
		const zipFile = path.join(RAW_API_JSON_FILES_FOLDER, zipFileName);
		await mkdir(RAW_API_JSON_FILES_FOLDER, {recursive: true});

		await finished(Readable.fromWeb(response.body).pipe(createWriteStream(zipFile)));

		const zip = await yauzl.open(zipFile);
		try {
			for await (const entry of zip) {
				if (entry.filename.endsWith("/")) {
					await mkdir(path.join(RAW_API_JSON_FILES_FOLDER, entry.filename));
				} else {
					const readEntry = await entry.openReadStream();
					const writeEntry = createWriteStream(path.join(RAW_API_JSON_FILES_FOLDER, entry.filename));
					await pipeline(readEntry, writeEntry);
				}
			}
		} finally {
			await zip.close();
		}

		// Remove the ZIP file, so that the folder will contain only JSON files
		await unlink(zipFile);
		return RAW_API_JSON_FILES_FOLDER;
	} else {
		throw new Error(`The request to "${url}" returned a malformed response and cannot be read.`);
	}
}

export async function cleanup() {
	const apiJsonList = await readdir(RAW_API_JSON_FILES_FOLDER);

	await Promise.all(apiJsonList.map((library) => unlink(path.join(RAW_API_JSON_FILES_FOLDER, library))));
}
