# Changelog

## [0.2.3](https://github.com/SAP/ui5-linter/compare/v0.2.2...v0.2.3) (2024-06-04)


### Features

* Component best practices- async flags check ([#73](https://github.com/SAP/ui5-linter/issues/73)) ([1c58105](https://github.com/SAP/ui5-linter/commit/1c5810593abf227a88a908c9d17aa9eacf113f10))


### Bug Fixes

* Correct type for deprecated call on return value of another call ([e715dbc](https://github.com/SAP/ui5-linter/commit/e715dbc5b5d9993650eae232d3f4fe86265d2ad3))
* Improve parsing of message details in VS Code problems matcher ([ea8e258](https://github.com/SAP/ui5-linter/commit/ea8e258f29c89b43e3dfe8bda6956ccce4eb0047))
* Position of deprecated function call errors ([7084704](https://github.com/SAP/ui5-linter/commit/70847041fe83a5a8d1974a3a0b183c0c8309c9cd))


### Dependencies

* Bump @sapui5/types to 1.120.13 ([#116](https://github.com/SAP/ui5-linter/issues/116)) ([6e0744e](https://github.com/SAP/ui5-linter/commit/6e0744e863bfdd3397d96b894fd59bc96517d983))
* Bump @sapui5/types to 1.120.14 ([a1afef5](https://github.com/SAP/ui5-linter/commit/a1afef5295e97462f7e5834347f993383f2e7ce2))

## [0.2.2](https://github.com/SAP/ui5-linter/compare/v0.2.1...v0.2.2) (2024-04-23)


### Bug Fixes

* Don't exit synchronously when there still might be async I/O ([#90](https://github.com/SAP/ui5-linter/issues/90)) ([fd9b7b9](https://github.com/SAP/ui5-linter/commit/fd9b7b949ed1b6b1f6d481ef214f4b5f39484f98))


### Dependencies

* **eslint:** Upgrade @eslint/js and @stylistic/eslint-plugin ([41b3a98](https://github.com/SAP/ui5-linter/commit/41b3a98d81c7f33939b8bda748c17a02c82a7397))

## [0.2.1](https://github.com/SAP/ui5-linter/compare/v0.2.0...v0.2.1) (2024-04-17)


### Features

* Alerts for new ui5lint version in console ([#57](https://github.com/SAP/ui5-linter/issues/57)) ([9b17887](https://github.com/SAP/ui5-linter/commit/9b1788780c205080eb9a25fb1f682017a1736fc2))
* Check script tags for inline JS ([#48](https://github.com/SAP/ui5-linter/issues/48)) ([70b719a](https://github.com/SAP/ui5-linter/commit/70b719aa7b7b1bd7d1bfc5d19c0ca4c22c20983c))
* Detect deprecations in ui5.yaml (in root directory) ([#39](https://github.com/SAP/ui5-linter/issues/39)) ([db118b1](https://github.com/SAP/ui5-linter/commit/db118b16851a4aae328da33060213842009137fc))
* Detect pseudo modules ([#60](https://github.com/SAP/ui5-linter/issues/60)) ([508d81d](https://github.com/SAP/ui5-linter/commit/508d81d9ec8b9042bab63cff97e81c9c6305935f))


### Bug Fixes

* **amdTranspiler:** Fix substiute for sap.ui.require errbacks ([c52b53f](https://github.com/SAP/ui5-linter/commit/c52b53fc4ec8d289a6684ae43d4bc0af86e460f6))
* Respect src attribute for script tags and include module type for checks ([#70](https://github.com/SAP/ui5-linter/issues/70)) ([2b28e5f](https://github.com/SAP/ui5-linter/commit/2b28e5fdeae125aca1cf839a253f28244767d5a7))


### Dependencies

* Bump @sapui5/types to 1.120.12 ([fa7592b](https://github.com/SAP/ui5-linter/commit/fa7592b2b8d955cfd33aba425350fea3178bb490))
* Update typescript to v5.4.5 and move yauzl-promise to dev-deps ([8982185](https://github.com/SAP/ui5-linter/commit/8982185960ecee36de558b34eea06679c78a037a))

## [0.2.0](https://github.com/SAP/ui5-linter/compare/v0.1.3...v0.2.0) (2024-03-26)


### ⚠ BREAKING CHANGES

* **cli:** Depending on how UI5 linter is being used, this change might change the behavior of that particular scenario. For example a build script might abort further processing, if any linting errors are detected.

### Features

* Analyze sap.ui.core.Lib.init() call ([#33](https://github.com/SAP/ui5-linter/issues/33)) ([6d5bcdb](https://github.com/SAP/ui5-linter/commit/6d5bcdbc89487d2cba46c6df72336663b9635f4f))
* **cli:** In case of errors, exit with code 1 ([96331fc](https://github.com/SAP/ui5-linter/commit/96331fca906773f5b8c1399011a227762d523d57))


### Bug Fixes

* Update list of deprecated libs ([#42](https://github.com/SAP/ui5-linter/issues/42)) ([d38e356](https://github.com/SAP/ui5-linter/commit/d38e3563f79edc49fa6d2bf2c027bd8bd5315c0c))


### Performance Improvements

* Load SAPUI5 types only when needed ([#46](https://github.com/SAP/ui5-linter/issues/46)) ([b7e9a2b](https://github.com/SAP/ui5-linter/commit/b7e9a2bb168c2d1b599067739e1fed10fda699ea))


### Dependencies

* Bump @sapui5/types to 1.120.11 ([9cbdf1d](https://github.com/SAP/ui5-linter/commit/9cbdf1d8f77de920e4e6ff2d58ec5bc5868a7965))

## [0.1.3](https://github.com/SAP/ui5-linter/compare/v0.1.2...v0.1.3) (2024-03-19)


### Features

* Detect deprecated libs and components in manifest.json ([#34](https://github.com/SAP/ui5-linter/issues/34)) ([8aa74e1](https://github.com/SAP/ui5-linter/commit/8aa74e14e652481bf284696d672806ed82310f8d))


### Reverts

* Remove workaround for deprecation text ([5d81856](https://github.com/SAP/ui5-linter/commit/5d81856a62e779b55b363c98a7af9d8a457fcc47)), closes [#29](https://github.com/SAP/ui5-linter/issues/29)

## [0.1.2](https://github.com/SAP/ui5-linter/compare/v0.1.1...v0.1.2) (2024-03-14)


### Bug Fixes

* **npm:** Install error "Unsupported platform @esbuild/aix-ppc64@0.19.12" ([5815178](https://github.com/SAP/ui5-linter/commit/5815178d3fa79b57552f439bf5b8d9a04827023f))

## [0.1.1](https://github.com/SAP/ui5-linter/compare/v0.1.0...v0.1.1) (2024-03-14)


### Features

* Detect usage of deprecated jQuery.sap API ([e8e2314](https://github.com/SAP/ui5-linter/commit/e8e2314032ecae84e427b4c5e680805d124a7ac6))


### Bug Fixes

* Remove duplicate messages ([81a6671](https://github.com/SAP/ui5-linter/commit/81a667187bbc28e6c6e200081970acbd0bdffd66))
* **xml-transpiler:** Log unknown namespaces as verbose instead of warning ([6a73c17](https://github.com/SAP/ui5-linter/commit/6a73c17e776601d48acc68386bcfc895e446c85d))


### Performance Improvements

* Only collect coverage info / details when requested ([8ac64f6](https://github.com/SAP/ui5-linter/commit/8ac64f64db1c1523d659f6e589f669991e98d3ae))

## [0.1.0](https://github.com/SAP/ui5-linter/compare/v0.0.1...v0.1.0) (2024-03-13)


### Features

* Add support for Node v18.14.2 ([eb21b02](https://github.com/SAP/ui5-linter/commit/eb21b020715ea073f56d56c3c63bf78db2491485))
* Enable links in VS Code terminal ([#6](https://github.com/SAP/ui5-linter/issues/6)) ([1572f77](https://github.com/SAP/ui5-linter/commit/1572f772159ad1762233921410392bb64f129ddf))
* Initial version ([5466be5](https://github.com/SAP/ui5-linter/commit/5466be5b983c4c6e6108c0d97d5221b8ad320a88))
