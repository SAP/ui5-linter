# UI5 Linter Development

**Note:** This document is intended to support UI5 linter developers and is not relevant for end users of the linter.

## Updating SAPUI5 types

UI5 linter currently comes with a fixed version of the SAPUI5 types that needs to be updated manually.
An update can be performed with following command:
```sh
npm run update-sapui5-types -- <domain> <version>
```

**Note:**
- `domain` is the internal domain (without protocol) that hosts the SAPUI5 SDK API JSON files.
- `version` is the version of the SAPUI5 distribution.

The script updates multiple places where the corresponding SAPUI5 types are referenced or incorporated:
- `@sapui5/types` npm dependency in [package.json](../package.json)
  - This package contains the TypeScript definitions of all SAPUI5 libraries and is relevant for the general TypeScript based detection.
- [`resources/api-extract.json`](../resources/api-extract.json)
  - This file contains additional information that is not available or accessible via the TypeScript definitions. It is an extract from the original `api.json` files of the SAPUI5 libraries.
- [`resources/overrides/pseudo-modules`](../resources/overrides/pseudo-modules)
  - This folder contains additional module declarations for the detection of pseudo modules.
