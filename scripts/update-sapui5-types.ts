import createMetadataInfo from "./metadataProvider/createMetadataInfo.js";
import createPseudoModulesInfo from "./metadataProvider/createPseudoModulesInfo.js";
import {cleanup, fetchAndExtractApiJsons} from "./metadataProvider/helpers.js";
import {promisify} from "node:util";
import {execFile as execFileCb} from "node:child_process";
const execFile = promisify(execFileCb);

try {
	const domain = process.argv[2];
	const version = process.argv[3];

	if (!domain) {
		throw new Error("First argument \"domain\" is missing");
	}

	if (!version) {
		throw new Error("Second argument \"version\" is missing");
	}

	const url = `https://${domain}/artifactory/build-releases/com/sap/ui5/dist/sapui5-sdk-dist/${version}/sapui5-sdk-dist-${version}-api-jsons.zip`;
	const apiJsonsRoot = await fetchAndExtractApiJsons(url);

	await createMetadataInfo(apiJsonsRoot, version);
	await createPseudoModulesInfo(apiJsonsRoot);

	await cleanup();

	// Update @sapui5/types npm package
	await execFile("npm", ["install", "-E", `@sapui5/types@${version}`]);
} catch (err) {
	process.stderr.write(String(err));
	process.exit(1);
}
