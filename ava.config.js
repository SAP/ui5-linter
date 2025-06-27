let tsimp = "tsimp/import";
// In Node versions prior to v20.6, we must use "tsimp/loader"
// tsimp = "tsimp/loader"" // TODO
const nodeArguments = [
	`--import=${tsimp}`,
	"--no-warnings=ExperimentalWarning",
];

export default {
	extensions: {
		ts: "module",
	},
	files: [
		"test/lib/**/*.ts",
	],
	watchMode: {
		ignoreChanges: [
			"test/tmp/**",
			"lib/**",
		],
	},
	nodeArguments,
	workerThreads: false,
	timeout: "20s", // Increased timeout for slower CI environments
};
