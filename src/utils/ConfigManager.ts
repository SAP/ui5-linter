import path from "node:path";

export interface UI5LintConfigType {
	ignores?: string[];
};

const CONFIG_FILENAMES = [
	"ui5lint.config.js",
	"ui5lint.config.mjs",
	"ui5lint.config.cjs",
];

export default class ConfigManager {
	#cwd: string;
	#configFile: string | null;

	constructor(configFile?: string, cwd?: string) {
		this.#cwd = cwd ?? process.cwd();
		this.#configFile = configFile ?? null;
	}

	async getConfiguration(): Promise<UI5LintConfigType[]> {
		const configs: UI5LintConfigType[] = [];
		let config: UI5LintConfigType | undefined;

		if (this.#configFile) {
			const configFilePath = path.resolve(this.#cwd, this.#configFile);
			config = await import(configFilePath) as UI5LintConfigType;
		} else {
			// Find configuration file
			({default: config} = await Promise.any(
				CONFIG_FILENAMES.map(
					(filename) => {
						const configFilePath = path.resolve(this.#cwd, filename);
						return import(configFilePath) as Promise<{default: UI5LintConfigType}>;
					}))
				// Promise.any would throw if nothing is found i.e. there's no config file
				.catch(() => ({default: undefined})));
		}

		if (Array.isArray(config)) {
			configs.push(...config);
		} else if (config) {
			configs.push(config);
		}

		return configs;
	}
}
