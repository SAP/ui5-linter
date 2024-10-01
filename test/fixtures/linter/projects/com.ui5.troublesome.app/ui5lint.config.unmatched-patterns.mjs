export default {
	files: [
		"webapp/**/*",
		"unmatched-pattern1",
		"unmatched-pattern2",
		"unmatched-pattern3",
	],
	ignores: [
		"test/**/*", 
		"!test/sap/m/visual/Wizard.spec.js",
	],
};
