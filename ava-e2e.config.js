// Calculate nodeArguments based on the Node version
import defaultAvaConfig from "./ava.config.js";

defaultAvaConfig.files = ["test/e2e/**/*.ts"];

export default defaultAvaConfig;
