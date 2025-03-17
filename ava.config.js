const nodeArguments = [
	"--import=tsx/esm",
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
