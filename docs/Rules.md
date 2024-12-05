# Rules Reference

- [Rules Reference](#rules-reference)
	- [async-component-flags](#async-component-flags)
	- [csp-unsafe-inline-script](#csp-unsafe-inline-script)
	- [no-deprecated-api](#no-deprecated-api)
	- [no-deprecated-component](#no-deprecated-component)
	- [no-deprecated-control-renderer-declaration](#no-deprecated-control-renderer-declaration)
	- [no-deprecated-library](#no-deprecated-library)
	- [no-deprecated-theme](#no-deprecated-theme)
	- [no-globals](#no-globals)
	- [no-pseudo-modules](#no-pseudo-modules)
	- [parsing-error](#parsing-error)
	- [ui5-class-declaration](#ui5-class-declaration)

## async-component-flags

Checks whether a Component is configured for asynchronous loading via the `sap.ui.core.IAsyncContentCreation` interface in the Component metadata or via `async` flags in the `manifest.json`.

**Related information**
- [Use Asynchronous Loading](https://ui5.sap.com/#/topic/676b636446c94eada183b1218a824717)
- [Component Metadata](https://ui5.sap.com/#/topic/0187ea5e2eff4166b0453b9dcc8fc64f)
- [sap.ui.core.IAsyncContentCreation](https://ui5.sap.com/1.120/#/api/sap.ui.core.IAsyncContentCreation)

## csp-unsafe-inline-script

Checks whether inline scripts are used in HTML files in accordance with Content Security Policy (CSP) best practices.

**Related information**
- [Content Security Policy](https://ui5.sap.com/#/topic/fe1a6dba940e479fb7c3bc753f92b28c)

## no-deprecated-api

Checks whether deprecated APIs, features or parameters are used in the project.

**Related information**
- [Best Practices for Developers](https://ui5.sap.com/#/topic/28fcd55b04654977b63dacbee0552712)

## no-deprecated-component

Checks for dependencies to deprecated components in `manifest.json`.

**Related information**
- [Deprecated Themes and Libraries](https://ui5.sap.com/#/topic/a87ca843bcee469f82a9072927a7dcdb)

## no-deprecated-control-renderer-declaration

Checks whether the renderer of a control is declared correctly.

## no-deprecated-library

Checks for dependencies to deprecated libraries in `manifest.json` and `ui5.yaml`.

**Related information**
- [Deprecated Themes and Libraries](https://ui5.sap.com/#/topic/a87ca843bcee469f82a9072927a7dcdb)

## no-deprecated-theme

Checks for usage of deprecated themes in the code and HTML files.

**Related information**
- [Deprecated Themes and Libraries](https://ui5.sap.com/#/topic/a87ca843bcee469f82a9072927a7dcdb)

## no-globals

Checks for the usage of global variables in the code.

**Related information**
- [Best Practices for Developers](https://ui5.sap.com/#/topic/28fcd55b04654977b63dacbee0552712)

## no-pseudo-modules

Checks for dependencies to pseudo modules in the code.

**Related information**
- [Best Practices for Loading Modules - Migrating Access to Pseudo Modules](https://ui5.sap.com/#/topic/00737d6c1b864dc3ab72ef56611491c4)

## parsing-error

Syntax/parsing errors that appear during the linting process are reported with this rule.

## ui5-class-declaration

Checks whether the declaration of UI5 classes is correct. This rule only applies to TypeScript code where built-in ECMAScript classes are used instead of an `.extend()` call.