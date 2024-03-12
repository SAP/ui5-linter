import {initLogger} from "./logger.js";
import type {ArgumentsCamelCase} from "yargs";
/**
 * Base middleware for CLI commands.
 *
 * This middleware should be executed for every CLI command to enable basic features (e.g. logging).
 *
 * @param {object} argv The CLI arguments
 * @returns {object}
 */
export default async function (argv: ArgumentsCamelCase) {
	await initLogger(argv);
	return {};
}
