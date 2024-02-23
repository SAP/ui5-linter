export default {
	"extensions": {
		"ts": "module"
	},
	"files": [
		"test/lib/**/*.ts"
	],
	"watcher": {
		"ignoreChanges": [
			"test/tmp/**",
			"lib/**"
		]
	},
	"nodeArguments": [
		"--import=tsx/esm",
		"--no-warnings=ExperimentalWarning"
	],
	"workerThreads": false
};
