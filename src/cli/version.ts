let version: string;
let formattedVersion: string;

// This module holds the CLI's version information (set via cli.js) for later retrieval (e.g. from middlewares/logger)
export function setVersionInfo(v: string, p: string) {
	version = v;
	formattedVersion = `${v} (from ${p})`;
}
export function getVersion(): string {
	return version || "";
}
export function getFormattedVersion(): string {
	return formattedVersion || "";
}
