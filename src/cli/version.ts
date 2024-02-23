let version: string;

// This module holds the CLI's version information (set via cli.js) for later retrieval (e.g. from middlewares/logger)
export function setVersion(v: string) {
	version = v;
}
export function getVersion(): string {
	return version || "";
}
