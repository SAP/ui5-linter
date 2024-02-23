/* eslint-env node */
module.exports = {
	env: {
		node: true,
		es2022: true
	},
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:ava/recommended"],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "ava"],
	rules: {
		"indent": [
			"error",
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"double",
			{"allowTemplateLiterals": true}
		],
		"semi": [
			"error",
			"always"
		],
		"max-len": [
			"error",
			{
				"code": 120,
				"ignoreUrls": true,
				"ignoreRegExpLiterals": true
			}
		],
		"no-implicit-coercion": [
			2,
			{"allow": ["!!"]}
		],
		"no-console": "error",
		// ava/assertion-arguments reports concatenated strings in a assertion message as an issue
		// See: https://github.com/avajs/eslint-plugin-ava/issues/332
		"ava/assertion-arguments": 0,
		"no-unused-vars": "off", // Turn off default rule to customize typescript variant
		"@typescript-eslint/no-unused-vars": [
			"error", {
				"argsIgnorePattern": "^_",
				"varsIgnorePattern": "^_",
				"caughtErrorsIgnorePattern": "^_"
			}
		]
	},
	root: true,
};
