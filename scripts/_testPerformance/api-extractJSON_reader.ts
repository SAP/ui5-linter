/* eslint-disable max-len */
/* eslint-disable no-console */
import {loadApiExtract} from "../../src/utils/ApiExtract.js";

const NUMBER_OF_TEST_RUNS = 1000;

const runTest = (func: () => void, numberOfTestRuns: number, testName: string) => {
	const startTime = performance.now();
	for (let i = 0; i < numberOfTestRuns; i++) {
		func();
	}
	console.log(`Performing ${testName} ${numberOfTestRuns} times took ${Math.round((performance.now() - startTime))} ms.`);
};

const main = async () => {
	try {
		const apiExtract = await loadApiExtract();
		console.log(`Performing each test ${NUMBER_OF_TEST_RUNS} times...`);

		// Test Case 1: Collect defaultAggregation of "sap.m.App"
		// (1 level deep, borrowed from "sap.m.NavContainer"):
		runTest(() => apiExtract.getDefaultAggregation("sap.m.App"), NUMBER_OF_TEST_RUNS, "Test Case 1");

		// Test Case 2: Check if option "backgroundColor" in "sap.m.App" exists
		// (0 levels deep):
		runTest(() => apiExtract.getTypeByOption("sap.m.App", "backgroundColor"), NUMBER_OF_TEST_RUNS, "Test Case 2");

		// Test Case 3: Check if option "pages" in "sap.m.App" exists
		// (1 level deep, borrowed from "sap.m.NavContainer"):
		runTest(() => apiExtract.getTypeByOption("sap.m.App", "pages", true), NUMBER_OF_TEST_RUNS, "Test Case 3");

		// Test Case 4: Collect all properties of "sap.m.App"
		// (0 levels deep):
		runTest(() => apiExtract.getAllOptionsByType("sap.m.App", "properties"), NUMBER_OF_TEST_RUNS, "Test Case 4");

		// Test Case 5: Collect all properties of "sap.m.App" and its borrowed ones
		// (>1 levels deep):
		runTest(() => apiExtract.getAllOptionsByType("sap.m.App", "properties", true), NUMBER_OF_TEST_RUNS, "Test Case 5");

		// Test Case 6: Collect "formatError" from "sap.m.App"
		// (4 levels deep, borrowed from "sap.ui.base.ManagedObject"):
		runTest(() => apiExtract.getTypeByOption("sap.m.App", "formatError", true), NUMBER_OF_TEST_RUNS, "Test Case 6");
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};

await main();
