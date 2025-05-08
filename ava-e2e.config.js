import defaultAvaConfig from "./ava.config.js";

defaultAvaConfig.files = ["test/e2e/**/*.ts"];
defaultAvaConfig.timeout = "60s"; // Increased timeout for slower CI environments

export default defaultAvaConfig;
