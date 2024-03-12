import {satisfies} from "semver";
import process from "node:process";

// Calculate nodeArguments based on the Node version
const nodeArguments = [];
if (satisfies(process.versions.node, "< 18.19.0")) {
	nodeArguments.push("--loader=tsx/esm");
	nodeArguments.push("--loader=esmock");
} else {
	nodeArguments.push("--import=tsx/esm");
}
nodeArguments.push("--no-warnings=ExperimentalWarning");

export default {
	extensions: {
		ts: "module",
	},
	files: [
		"test/lib/**/*.ts",
	],
	ignoredByWatcher: [
		"test/tmp/**",
		"lib/**",
	],
	nodeArguments,
	workerThreads: false,
};
