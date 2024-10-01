![UI5 logo](./docs/images/UI5_logo_wide.png)

# UI5 linter

> A static code analysis tool for UI5

[![OpenUI5 Community Slack (#tooling channel)](https://img.shields.io/badge/slack-join-44cc11.svg)](https://ui5-slack-invite.cfapps.eu10.hana.ondemand.com/)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.1%20adopted-ff69b4.svg)](https://github.com/SAP/ui5-linter?tab=coc-ov-file#readme)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP/ui5-linter)](https://api.reuse.software/info/github.com/SAP/ui5-linter)
[![npm Package Version](https://badge.fury.io/js/%40ui5%2Flinter.svg)](https://www.npmjs.com/package/@ui5/linter)
[![Coverage Status](https://coveralls.io/repos/github/SAP/ui5-linter/badge.svg)](https://coveralls.io/github/SAP/ui5-linter)

## Description

UI5 linter is a static code analysis tool for UI5 projects.
It checks JavaScript, TypeScript, XML, JSON, and other files in your project and reports findings.

## Features
UI5 linter scans your UI5 project ands detects code which won't work when running your project with [UI5 2.x](https://community.sap.com/t5/open-source-blogs/introducing-openui5-2-x/ba-p/13580633). 

* Usage of deprecated UI5 libraries 
* Usage of deprecated UI5 framework APIs 
* Usage of global variables 
* Possible CSP violations 
* Deprecated component and manifest configurations  

> [!NOTE]
> While UI5 linter already provides many detection features, it is not yet covering all aspects and best practices for UI5 2.x. The intention of UI5 linter is to detect as many issues as possible that a project running with UI5 2.x might be facing. However, you'll still need to test your UI5 project with UI5 2.x as soon as it is made available. To reveal additional issues, the UI5 team plans to release more versions of UI5 linter over the next months. 

## Requirements

- [Node.js](https://nodejs.org/) Version v20.11.x, v22.0.0, or higher
- [npm](https://www.npmjs.com/) Version v8.0.0 or higher

## Installation

Install the CLI using the npm package manager:

```sh
# Global
npm install --global @ui5/linter

# In your project
npm install --save-dev @ui5/linter
```

## Usage

Run the `ui5lint [files...]` command in your project root folder

```sh
> ui5lint

UI5 linter report:

/application/webapp/controller/App.controller.js
  10:4 error Call to deprecated function 'attachTap' of class 'Button'

/application/webapp/manifest.json
  81:17 error Use of deprecated model type 'sap.ui5/models/odata/type="sap.ui.model.odata.ODataModel"'

/application/webapp/test/unit/unitTests.qunit.js
  6:1 error Call to deprecated function 'attachInit' of class 'Core'
  6:1 error Call to deprecated function 'getCore' (sap.ui.getCore)
  6:1 error Access of global variable 'sap' (sap.ui.getCore)

/application/webapp/view/Main.view.xml
  16:39 error Import of deprecated module 'sap/m/MessagePage'
  22:5  error Use of deprecated property 'blocked' of class 'Button'

7 problems (7 errors, 0 warnings)

Note: Use "ui5lint --details" to show more information about the findings
```

You can provide multiple glob patterns as arguments after the `ui5lint` command to filter and narrow down the linting results. 

**Note**: this can't be used to include files that normally wouldn't be checked (e.g. files outside of `webapp` in application projects)

**Note**: Only POSIX separators are allowed, regardless of the target platform.

```sh
> ui5lint "webapp/**/*.xml"

UI5 linter report:

webapp/view/App.view.xml
  7:8 error Import of deprecated module 'sap/f/Avatar'

1 problems (1 errors, 0 warnings)

Note: Use "ui5lint --details" to show more information about the findings
```



### Options

#### `--details`

Show more information about the findings and how to fix them.

**Example:**
```sh
ui5lint --details
```

#### `--format`

Choose the output format. Currently, `stylish` (default), `json` and `markdown` are supported.

**Example:**
```sh
ui5lint --format json
```

#### `--ignore-pattern`

Pattern/files that will be ignored during linting. Can also be defined in `ui5lint.config.js`.

**Example:**
```sh
ui5lint --ignore-pattern "webapp/thirdparty/**"
```

#### `--config`

Load a custom config by relative file path (default: `./ui5lint.config.js`).

**Example:**
```sh
ui5lint --config ./ui5lint-custom.config.js
```

## Configuration

The UI5 linter can easily be configured with an external configuration file, allowing you to customize how the linter behaves. For example, you can tell it to ignore specific files or directories. 

### Configuration File Location
The configuration file must be placed in the root directory of your project, alongside the `ui5.yaml` and `package.json` files. The linter will automatically detect and load the file when it runs.

### Supported Configuration File Names
You can name your configuration file using one of the following formats:
- `ui5lint.config.js`
- `ui5lint.config.mjs`
- `ui5lint.config.cjs`

If you need to specify a custom configuration file, you can provide it using the `--config` parameter via the command line.

### Configuration File Format

#### ESM (ECMAScript Modules):
```js
export default {
  ignores: [
    "webapp/thirdparty/**",
    "webapp/test/**",
    "!webapp/test/integration/**",
  ],
};
```

#### CommonJS:
```js
module.exports = {
  ignores: [
    "webapp/thirdparty/**",
    "webapp/test/**",
    "!webapp/test/integration/**",
  ],
};
```

### Configuration Options

- **ignores**: This option allows you to define glob patterns to ignore specific files or directories during linting. Patterns are relative to the root of the project. You can also un-ignore specific files by using the `!` prefix. The order of the patterns matters; later patterns override earlier ones.

Example:
```js
ignores: [
  "webapp/test/**",               // Ignore all files in the test folder
  "!webapp/test/integration/**",  // Un-ignore files in a specific subdirectory
];
```

In this way, you can control which files the UI5 linter should process and which it should ignore.

## Support, Feedback, Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/SAP/ui5-linter/issues). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).

You can also chat with us in the [`#tooling`](https://openui5.slack.com/archives/C0A7QFN6B) channel of the [OpenUI5 Community Slack](https://ui5-slack-invite.cfapps.eu10.hana.ondemand.com/). For public Q&A, use the [`ui5-tooling` tag on Stack Overflow](https://stackoverflow.com/questions/tagged/ui5-tooling).

## Security / Disclosure
If you find any bug that may be a security problem, please follow our instructions at [in our security policy](https://github.com/SAP/ui5-linter/security/policy) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/SAP/ui5-linter?tab=coc-ov-file#readme) at all times.

## Licensing

Copyright 2024 SAP SE or an SAP affiliate company and contributors. Please see our [LICENSE](./LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/SAP/ui5-linter).
